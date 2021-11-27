from RouterOS_API.routeros_api import Api

with open('secrets.txt') as f:
    USER = f.readline().strip()
    PASSWORD = f.readline().strip()

# print('user: ' + USER)
# print('password: ' + PASSWORD)
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


def nn_to_ip(nn):
    if len(nn) == 4:
        return f'{nn[:2]}.{nn[2:]}'
    elif len(nn) == 3:
        return f'{nn[:1]}.{nn[1:]}'
    else:
        return f'0.{nn}'

def ip_to_nn(ip):
    splitted = ip.split('.')
    three = splitted[2]
    four = splitted[3]
    sxt = ""
    if len(four) == 3:
        sxt = f"sxt{four[0]} "
        four = four[1:]
    if three == '0':
        return sxt + four[1:] if four[0] == '0' else four
    elif len(four) == 1:
        return sxt + three + '0' + four
    else:
        return sxt + three + four