# takes in: ip as command line argument
# returns: list of nn-based routes with cost

from api_wrapper.api_helper import get_neighbors, get_interfaces, ip_to_nn
import sys
import csv
import json

if __name__ == '__main__':
  output = list()
  if len(sys.argv) != 2:
    raise ValueError("must include exactly one ip value")

  ip = sys.argv[1]
  try:
    routes = get_neighbors(ip)
    interfaces = get_interfaces(ip)
  except Exception as e:
    raise RuntimeError("failed to connect:"+ ip)

  for route in routes:
    route[2] = interfaces[route[2]]
    route[0] = ip_to_nn(route[0])
    route[1] = ip_to_nn(route[1])

    output.append(route)

  print(json.dumps(output))
  sys.stdout.flush()
  # with open("outputs/temp/edge_request.csv", "w") as f:
  #     writer = csv.writer(f)
  #     writer.writerows(output)



