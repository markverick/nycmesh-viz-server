from api_wrapper.api_helper import get_neighbors, get_interfaces
import json
import csv
import multiprocessing
import time
import copy

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

def get_neighbors_and_interfaces(ip, return_neighbors, return_interfaces):
    print(ip)
    return_neighbors += copy.deepcopy(get_neighbors(ip))
    interfaces = get_interfaces(ip)
    for interface, cost in interfaces.items():
        return_interfaces[interface] = cost

def get_edges(ip, edges, fail_to_connect):
    try:
        print(f"Pinging {ip}")
        routes = get_neighbors(ip)
        interfaces = get_interfaces(ip)
        for route in routes:
            route[2] = interfaces[route[2]]
            start = min(ip_to_nn(route[0]), ip_to_nn(route[1]))
            end = max(ip_to_nn(route[0]), ip_to_nn(route[1]))
            start_end = (start, end)
            cost = route[2]
            if start_end in edges:
                edges[start_end] = min(cost, edges[start_end])
            else:
                edges[start_end] = cost
    except Exception as e:
        fail_to_connect[ip] = ip_to_nn(ip)
        print("failed to connect: "+ ip)

if __name__ == '__main__':

    f = open('nodes.json', 'r')
    nodes = json.load(f)
    f.close()

    manager = multiprocessing.Manager()
    edges = manager.dict()
    fail_to_connect = manager.dict()

    for node in nodes:
        if node['nn']:
            ip_68 = '10.68.' + nn_to_ip(node['nn'])
            ip_69 = '10.69.' + nn_to_ip(node['nn'])
            routes = []
            for ip in [ip_68, ip_69]:
                p = multiprocessing.Process(target=get_edges, args=(ip, edges, fail_to_connect))
                p.start()
                p.join(3)
                if p.is_alive():
                    p.kill()
                    fail_to_connect[ip] = ip_to_nn(ip)
                    print("failed to connect: "+ ip)

    output_edges = []

    for edge, cost in edges.items():
        output_edges.append([edge[0], edge[1], cost])

    output_fail_to_connect = []

    for fail_ip, fail_nn in fail_to_connect.items():
        output_fail_to_connect.append([fail_ip, fail_nn])

    with open("edges_set2.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerows(output_edges)

    with open("failed_to_connect2.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerows(output_fail_to_connect)
    