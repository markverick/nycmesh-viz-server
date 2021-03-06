from api_wrapper.api_helper import get_neighbors, get_interfaces, ip_to_nn
import csv

# print(get_neighbors('10.69.40.26'))
# print(get_neighbors_verbose('10.69.40.26'))

unseen = {'10.69.7.13', '10.69.2.27'}
seen = set()
fail_to_connect = set()
edges = list()
nn_to_ip_dict = dict()

while(len(unseen) > 0):
  cur = unseen.pop()
  cur_nn = ip_to_nn(cur)
  nn_to_ip_dict[cur_nn] = cur
  seen.add(cur)
  try:
    routes = get_neighbors(cur)
    interfaces = get_interfaces(cur)
  except Exception as e:
    fail_to_connect.add(cur)
    print("failed to connect:"+ cur)
    continue
  # print(router.talk('/ip/route/print'))

  for route in routes:
    address = route[1]
    route[2] = interfaces[route[2]]

    if address not in seen:
      if (address.startswith('10.70')):
        print('skipping: ' + address)
        continue

      print(route)
      unseen.add(address)
      edges.append(route)

edges_nn = [[ip_to_nn(edge[0]), ip_to_nn(edge[1]), edge[2]] for edge in edges]

other_edges_nn = [
  ["3461", "5916", 5],
  ["5916", "1340", 5],
  ["1340" ,"3461", 64],
  ["1933", "1932", 2],
  ["1933", "5916", 10],
  ["1417", "1340", 10],
  ["2463", "1932", 10],
  ["2274", "2463", 9]
]

with open("outputs/edges_set.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(edges_nn + other_edges_nn)

with open("outputs/failed_to_connect.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerow(list(fail_to_connect))

with open("outputs/nn_to_ip_dict.csv", "w") as f:
    writer = csv.writer(f)
    for key, value in nn_to_ip_dict.items():
       writer.writerow([key, value])

print(edges_nn)