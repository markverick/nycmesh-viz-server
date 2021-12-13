import os
import json

from apiclient import discovery
from google.oauth2 import service_account

try:
    scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    secret_file = os.path.join(os.getcwd(), 'credentials.json')

    spreadsheet_id = '1gEnDuwqIQtm-uWsF7ZlXEDZWEyrGtqpj-mGXhQldSK4'
    range_name = 'Form Responses 1!P2:AO10487'

    credentials = service_account.Credentials.from_service_account_file(secret_file, scopes=scopes)
    service = discovery.build('sheets', 'v4', credentials=credentials)

    result = service.spreadsheets().values().get(spreadsheetId= spreadsheet_id, range=range_name).execute()
    result = result.get('values',[])

    nodes_list = []
    for node in result:
      if node[8] == "":
        continue

      print(node)
      node_entry = {}
      node_entry['id'] = node[8]
      node_entry['nn'] = node[8] if "x" in node[8] else node[9]
      node_entry['lat'] = node[23]
      node_entry['lng'] = node[24]
      node_entry['alt'] = node[25] if len(node) > 25 else ''

      if "hub" in node[4].lower():
        node_entry['type'] = "hub"
      elif "supernode" in node[3].lower():
        node_entry['type'] = "supernode"
      else:
        node_entry['type'] = "node"

      nodes_list.append(node_entry)

    with open('outputs/nodes.json', 'w') as f:
        json.dump(nodes_list, f)

except OSError as e:
    print(e)
