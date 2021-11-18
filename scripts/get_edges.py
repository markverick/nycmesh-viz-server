from api_wrapper.api_helper import get_neighbors, get_interfaces
import csv

# print(get_neighbors('10.69.40.26'))
# print(get_neighbors_verbose('10.69.40.26'))

unseen = {'10.69.40.26'}
seen = set()
fail_to_connect = set()
edges = list()

while(len(unseen) > 0):
  cur = unseen.pop()
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
      print(route)
      unseen.add(address)
      edges.append(route)

with open("edges_set.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(edges)

with open("failed_to_connect.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerows(list(fail_to_connect))

print(edges)