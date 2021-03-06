import scipy.stats
import json
import sys
import os.path
import math
import numpy as np

RAD = 0.017453292519943295769236907684886
earth_radius = 6372797.560856

def calc_distance(coords):
    distance = 0
    for i in range(0, len(coords)-1):
        distance += spheric_distance(coords[i], coords[i+1])

    return distance

def spheric_distance(coord1, coord2):
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    dlat1 = lat1 * (RAD)
    dlong1 = lon1 * (RAD)
    dlat2 = lat2 * (RAD)
    dlong2 = lon2 * (RAD)

    dLong = dlong1 - dlong2
    dLat = dlat1 - dlat2

    aHarv = math.sin(dLat / 2.0)**2  + math.cos(dlat1) * math.cos(dlat2) * math.sin(dLong / 2.)**2
    cHarv = 2. * math.atan2(math.sqrt(aHarv), math.sqrt(1.0 - aHarv))
    return earth_radius * cHarv

def _decode_coordinate_diff(encoded, index):
    shift = 5
    b = ord(encoded[index]) - 63
    result = b & 0x1f
    index += 1
    while b >= 0x20:
        b = ord(encoded[index]) - 63
        result |= (b & 0x1f) << shift
        index += 1
        shift += 5
    diff = (result & 1) and ~(result >> 1) or (result >> 1)
    return (index, diff)

def decode_polyline(encoded, precision=6):
    if not encoded:
        return None

    decoded = []

    scaling = 10**precision
    lat = 0
    lng = 0
    index = 0
    while index < len(encoded):
        index, dlat = _decode_coordinate_diff(encoded, index)
        index, dlng = _decode_coordinate_diff(encoded, index)
        lat += dlat
        lng += dlng
        decoded.append((lat / scaling, lng / scaling))

    return decoded

class BayesClassifier:
    def __init__(self, dist, valid_params, valid_prior, invalid_params, invalid_prior, confidence):
        self._valid_dist = dist(*valid_params)
        self._invalid_dist = dist(*invalid_params)
        self._valid_prior = valid_prior
        self._invalid_prior = invalid_prior
        self._confidence = confidence
        self._get_prob = lambda d, x: d.pdf(x)
        if 'pdf' not in dir(dist):
            self._get_prob = lambda d, x: d.pmf(x)

    def _post_valid(self, x):
        a = self._get_prob(self._valid_dist, x) * self._valid_prior
        b = self._get_prob(self._invalid_dist, x) * self._invalid_prior
        return a / (a+b)

    def _post_invalid(self, x):
        a = self._get_prob(self._valid_dist, x) * self._valid_prior
        b = self._get_prob(self._invalid_dist, x) * self._invalid_prior
        return b / (a+b)

    def classify(self, x):
        if self._post_valid(x) > self._post_invalid(x) + self._confidence:
            return "valid"
        return "invalid"

def compute_feature(d):
    matching_dist = calc_distance(decode_polyline(d['geometry']))
    trace_dist = calc_distance(d['trace'])
    if matching_dist == 0:
        return
    f = -math.log(trace_dist / matching_dist)
    return f


def get_features(db_path, feature_func=compute_feature):
    data = ""
    with open(db_path, "r") as f:
        data = json.load(f)

    valid_features = []
    invalid_features = []
    for m in data['matchings']:
        f = feature_func(m)
        if f is None:
            continue

        if m['cls'] == 2 or m['cls'] == 3:
            invalid_features.append(f)
        elif m['cls'] == 1 or m['cls'] == 4:
            valid_features.append(f)

    return (valid_features, invalid_features)

def get_parameters(valid_features, invalid_features, dist=scipy.stats.laplace):
    valid_params = dist.fit(valid_features)
    invalid_params = dist.fit(invalid_features)
    valid_prior = len(valid_features) / (len(valid_features) + len(invalid_features))
    invalid_prior = len(invalid_features) / (len(valid_features) + len(invalid_features))

    return (valid_params, valid_prior, invalid_params, invalid_prior)

def run_classification(valid_features, valid_params, valid_prior, invalid_features, invalid_params, invalid_prior, dist=scipy.stats.laplace):
    classifier = BayesClassifier(dist, valid_params, valid_prior, invalid_params, invalid_prior, 0.0)

    p = n = fp = fn = 0
    for f in valid_features:
        if classifier.classify(f) == "valid":
            p += 1
        else:
            fn += 1

    for f in invalid_features:
        if classifier.classify(f) == "invalid":
            n += 1
        else:
            fp += 1

    return (p, n, fp, fn)

def get_matched_distance(feature):
    dists = [spheric_distance(m, t) for m, t in zip(feature['matched'], feature['trace'])]
    return dists

def get_distance_deltas(feature):
    return feature['distance_deltas']

def estimate_gps_precision(db_path):
    valid_features, _ = get_features(db_path, get_matched_distance)
    flattened = []
    for dists in valid_features:
        flattened += dists

    # Median Absolute Deviation estimator
    gps_precision = 1.4826 * np.median(flattened)
    return gps_precision

def estimate_map_beta(db_path):
    valid_features, _ = get_features(db_path, get_distance_deltas)
    flattened = []
    for dists in valid_features:
        flattened += dists

    # not the estimator given in the paper, but wikipedia sugguests this
    map_beta = np.mean(flattened)
    return map_beta

if __name__ == '__main__':
    directory = sys.argv[1]
    db_path = os.path.join(directory, 'tested_db.json')

    valid_features, invalid_features = get_features(db_path)

    (valid_params, valid_prior, invalid_params, invalid_prior) = get_parameters(valid_features, invalid_features)

    (p, n, fp, fn) = run_classification(valid_features, valid_params, valid_prior, invalid_features, invalid_params, invalid_prior)

    gps_precision = estimate_gps_precision(db_path)
    map_beta = estimate_map_beta(db_path)

    print("Map beta: %f" % map_beta)
    print("GPS precision: %f" % gps_precision)
    print("valid params: %f, %f" % (valid_params[0], valid_params[1]))
    print("invalid params: %f, %f" % (invalid_params[0], invalid_params[1]))
    print("valid prior: %f" % valid_prior)
    print("valid: %f" % p)
    print("invalid: %f" % n)
    print("false-valid: %f" % fp)
    print("false-invalid: %f" % fn)
    print("-> FP-rate: %f" % (fp / (fp + n)))
    print("-> FN-rate: %f" % (fn / (fn + p)))
