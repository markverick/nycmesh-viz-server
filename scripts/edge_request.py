# takes in: ip as command line argument
# returns: list of nn-based routes with cost

from api_wrapper.api_helper import get_neighbors, get_interfaces, ip_to_nn
import sys
import json

def get_nnroutes_from_ip(ip):
  output = list()

  try:
    routes = get_neighbors(ip)
    interfaces = get_interfaces(ip)
  except Exception as e:
    raise RuntimeError("failed to connect:"+ ip)

  for route in routes:
    dest_ip = route[1]
    route[2] = interfaces[route[2]]
    route[0] = ip_to_nn(route[0])
    route[1] = ip_to_nn(route[1])

    if 'sxt' in route[1]:
      print('sxt:' + route[1])
      bridge_routes = get_nnroutes_from_ip(dest_ip)
      for bridge_route in bridge_routes:
        bridge_route[0] = route[0]
        output.append(bridge_route)
    else:
      output.append(route)

  return output


if __name__ == '__main__':
  if len(sys.argv) != 2:
    raise ValueError("must include exactly one ip value")

  ip = sys.argv[1]

  output = get_nnroutes_from_ip(ip)

  print(json.dumps(output))
  sys.stdout.flush()
  # with open("outputs/temp/edge_request.csv", "w") as f:
  #     writer = csv.writer(f)
  #     writer.writerows(output)



