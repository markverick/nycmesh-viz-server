# takes in: ip as command line argument
# returns: list of nn-based routes with cost

from api_wrapper.api_helper import get_neighbors, get_interfaces, ip_to_nn
import sys
import json
import copy
#import csv

def insert_min_edge(route, dict) :
  start_end = (route[0], route[1])
  cost = route[2]
  if start_end in dict:
      dict[start_end] = min(cost, dict[start_end])
  else:
      dict[start_end] = cost

def get_nnroutes_from_ip(ip, seen_nn, cost):
  output = list()
  root_nn = ip_to_nn(ip)
  new_seen_nn = copy.deepcopy(seen_nn)
  new_seen_nn.append(root_nn)

  try:
    routes = get_neighbors(ip)
    interfaces = get_interfaces(ip)
  except Exception as e:
    raise RuntimeError("failed to connect:"+ ip)

  for route in routes:
    dest_ip = route[1]
    route[2] = int(interfaces[route[2]]) + cost
    route[0] = root_nn
    route[1] = ip_to_nn(route[1])

    if 'sxt' in route[1]:
      #print('sxt:' + route[1])
      if route[1] in new_seen_nn:
        continue

      bridge_routes = get_nnroutes_from_ip(dest_ip, new_seen_nn, route[2])
      for bridge_route in bridge_routes:
        bridge_route[0] = root_nn
        output.append(bridge_route)
    else:
      output.append(route)

  return output


if __name__ == '__main__':
  if len(sys.argv) != 2:
    raise ValueError("must include exactly one ip value")

  ip = sys.argv[1]

  edges = get_nnroutes_from_ip(ip, [], 0)
  cleaned_edges = {}
  for edge in edges:
    insert_min_edge(edge, cleaned_edges)

  output = []

  for edge, cost in cleaned_edges.items():
      output.append([edge[0], edge[1], cost])


  print(json.dumps(output))
  sys.stdout.flush()
  # with open("outputs/temp/edge_request.csv", "w") as f:
  #     writer = csv.writer(f)
  #     writer.writerows(output)



