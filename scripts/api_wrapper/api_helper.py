from RouterOS_API.routeros_api import Api

with open('secrets.txt') as f:
    USER = f.readline().strip()
    PASSWORD = f.readline().strip()

print('user: ' + USER)
print('password: ' + PASSWORD)
# inital demo code
# unseen = {'10.69.40.26'}
# seen = set()

# while(len(unseen) > 0):
#   cur = unseen.pop()
#   router = Api(cur, user='', password='')
#   routes = router.talk('/routing/ospf/neighbor/print')
#   seen.add(cur)
#   print(routes)
#   # print(router.talk('/ip/route/print'))

#   for route in routes:
#     parts = route["address"].split('/')
#     address = parts[0]
#     print(cur + " -> " + route["address"])
#     if address not in seen:
#       unseen.add(address)


def get_ospf_helper(ip, method):
    router = Api(ip, user=USER, password=PASSWORD)
    result = router.talk('/routing/ospf/' + method + '/print')
    return result


def get_neighbors_verbose(ip):
    return get_ospf_helper(ip, 'neighbor')


def get_neighbors(ip):
    routes = get_neighbors_verbose(ip)
    return [[ip, route["address"], route["interface"]] for route in routes]


def get_interfaces_verbose(ip):
    return get_ospf_helper(ip, 'interface')


def get_interfaces(ip):
    interfaces = get_interfaces_verbose(ip)
    return {interface["interface"]: interface["cost"] for interface in interfaces}
