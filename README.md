
# 1. Introduction

Elvis provides an out-of-the-box REST API which is useful for retrieving asset data and doing simple stats data. This example project shows how you can get more out of data stored in Elvis. It provides a simple API and a few plugins that support you in retrieving and displaying statistics. The examples can inspire you to create your own API's and create your own statistics relevant to your business.

Supported stats:
- Folder stats (API + client plugin): Total size in bytes per sub-folder
- Detect duplicates (API + client plugin): Duplicate report based on checksum, file name or file size.
- Usage info (API): Usage stats over a period of time

# 2. Installation prerequisites

- Fully installed and licensed [Elvis Server](https://www.woodwing.com/en/digital-asset-management-system) (6.7 or higher). 
- Machine where the stats server can run. This can be on the same machine where the Elvis Server runs or a different machine. Currently supported operating systems are Linux and OSX.

# 3. Installation steps

## 3.1 Stats server

This stats server needs to run on an Elvis Server node as it needs to communicate directly with Elasticsearch over localhost (the Elasticsearch API can only be accessed from localhost for security reasons).

- Clone or download this package.
- Open `src/config.ts` and configure the settings. You can either configure the settings in this config file or by setting environment variables. 
- Install [nodejs](https://nodejs.org) (6.9 or higher).
- Open a terminal and go to the package folder.
- Install TypeScript via npm: `npm install -g typescript`
- Install node modules: `npm install`
- Start the server: `npm start`
- The server is correctly started when a startup message is showed.

## 3.2 Secure the stats API by installing the Stats API plugin

The stats API plugin helps with securing the stats API. It ensures that only authenticated Elvis users that have the ROLE_STATS capability can use the API. The stats API plugin proxies all API requests through the Elvis Server node(s).

- To prevent unauthorized access, snsure that only Elvis Server node(s) can access the stats server
- Open the `elvis-plugins` folder.
- Copy the `stats_api` folder to: `<Elvis Config>/plugins/active`.
- Open `stats_api/action.config.xml`.
- Point the `url` setting to the stats server.
- [Activate](https://helpcenter.woodwing.com/hc/en-us/articles/115002644606) the plugin.

The stats API is now available through Elvis. For example, if your Elvis Server runs under https://elvis.mycompany.com, then the folder stats API will be available via https://elvis.mycompany.com/plugins/stats_api/folder-stats?folderPath=/your/path/here

## 3.3 Client plugins - display stats

After activation, the duplicate report plug-in is available in the top-right application menu]. The folder stats are available as panel plug-in in the right-side of the screen.

- Open the `elvis-plugins` folder.
- Copy the `duplicate_report` and `folder_stats` folders to: `<Elvis Config>/plugins/active`.
- [Activate](https://helpcenter.woodwing.com/hc/en-us/articles/115002644606) the plugin.

# 4. Using the API

This section describes the available API calls. The URL's assume you've installed the Stats API plugin and are relative to the Elvis Server URL. All examples require you to authenticate against Elvis and [pass proper authentication info](https://helpcenter.woodwing.com/hc/en-us/articles/115003742263-Elvis-6-REST-API-Performing-a-POST-160-request-with-a-csrf-token) using the [api login](https://helpcenter.woodwing.com/hc/en-us/articles/115004785283-Elvis-6-REST-API-API-login) method.

Note: You don't need to pass authentication info when calling the stats API from a web client plug-in as the Elvis Server already takes care of this.

## 4.1 GET `/plugin/stats_api/folder-stats`

Get (sub)-folder size statistics for a given folder. 

Query parameters:
- folderPath (optional - string): Folder to get stats for
- size (optional - number): Maximum number of results

In this example we show stats for all sub folders of the `/Demo Zone` folder.

Request
```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... Mn9g" -X GET "http://localhost:8080/plugins/stats_api/folder-stats?folderPath=%2FDemo%20Zone"
```

Response (200 OK)
```json
[
  {
    "name": "/demo zone/images",
    "size": 204464523,
    "sizeFormatted": "194.99MB"
  },
  {
    "name": "/demo zone/video",
    "size": 55335922,
    "sizeFormatted": "52.77MB"
  },
  {
    "name": "/demo zone/production",
    "size": 14984932,
    "sizeFormatted": "14.29MB"
  }
]
```

## 4.2 GET `/plugin/stats_api/detect-duplicates`

Detect duplicate assets.

Query parameters:
- field (optional - string): Field to perform duplicate detection on, valid values are: "filename", "fileSize" and "firstExtractedChecksum"
- size (optional - number): Maximum number of results

In this example we show how to retrieve duplcate assets based on `file name`.

Request:
```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... n9g" -X GET "http://localhost:8080/plugins/stats_api/detect-duplicates?field=filename&size=50"
```

Response (200 OK)
```json
[
  {
    "fieldValue": "parade.jpg",
    "duplicates": 5
  },
  {
    "fieldValue": "louvre.jpg",
    "duplicates": 2
  }
]
```

## 4.3 GET `/plugin/stats_api/usage`

Get Elvis usage stats over a period of time.

Query parameters:
- startDate (optional - string): Stats start date in dd/mm/yyyy format
- endDate (optional - string): Stats end date in dd/mm/yyyy format
- interval (optional - string): Interval period, valid values are "year", "month", "week" and "day"

In this example we show how to retrieve usage info per `month` for `2017`.

Request:
```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... n9g" -X GET "http://localhost:8080/plugins/stats_api/usage?startDate=01-01-2017&endDate=31-12-2017&interval=month"
```

Response (200 OK)
```json
[
  {
    "period": "August 2017",
    "actions": [
      {
        "action": "METADATA_UPDATE",
        "count": 175
      },
      {
        "action": "CREATE",
        "count": 13
      }
    ]
  },
  {
    "period": "October 2017",
    "actions": [
      {
        "action": "METADATA_UPDATE",
        "count": 465
      },
      {
        "action": "CREATE_RELATION",
        "count": 83
      }
    ]
  }
]
```


# 5. Version history

## v1.0.0
- folder-stats API
- detect-duplicates API
- usage API
- folder stats plug-in
- duplicate report plug-in
