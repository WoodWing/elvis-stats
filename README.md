
# 1. Introduction

Elvis provides an out-of-the-box REST API which is useful for retrieving asset data and doing simple stats data. This example project shows how you can get more out of data stored in Elvis. It provides a simple API and a few plugins that support you in retrieving and displaying statistics. The examples can inspire you to create your own API's and create your own statistics relevant to your business.

Supported stats:
- Folder stats (API + client plugin): Total size in bytes per sub-folder
- Detect duplicates (API + client plugin): Duplicate report based on checksum, file name or file size.
- Usage info (API): Usage stats over a period of time
- Published in (API + client plugins): Search and report where an asset is published (print, web, apps, social, etc).

# 2. Installation prerequisites

- Fully installed and licensed [Elvis Server](https://www.woodwing.com/en/digital-asset-management-system) (6.11 or higher). 
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
- Open `stats_api/api.config.xml`.
- Point the `url` setting to the stats server.
- [Activate](https://helpcenter.woodwing.com/hc/en-us/articles/115002644606) the plugin.

The stats API is now available through Elvis. For example, if your Elvis Server runs under https://elvis.mycompany.com, then the folder stats API will be available via https://elvis.mycompany.com/plugins/stats_api/folder-stats?folderPath=/your/path/here

## 3.3 Client plugins - display stats

After activation, the duplicate report plug-in is available in the top-right application menu]. The folder stats and published in are available as panel plug-in in the right-side of the screen.

- Open the `elvis-plugins` folder.
- Copy the `duplicate_report`, `folder_stats` and `published_in` folders to: `<Elvis Config>/plugins/active`.
- [Activate](https://helpcenter.woodwing.com/hc/en-us/articles/115002644606) the plugin.

# 4. Using the published in panel (add logging data)

The published in panel allows users to find which assets that were published. Right after installing the panel, it won't be of much use as there is no publish data in the stats index. Once the stats index is filled with publish data, the panel becomes relevant. The search boxes will be filled with options based on the information you [log in stats index](https://helpcenter.woodwing.com/hc/en-us/articles/115002663423-Elvis-6-REST-API-log-usage-stats).

Let's assume an asset is used in Print, on February 20th, 2018, for brand WW Magazine, Issue Feb-2018. In this case you could log this using the following request:

```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... n9g" -X POST "http://localhost:8080/services/logUsage?assetId=6p2cZhM2KeX8OYGqhHis5u&action=CUSTOM_ACTION_PUBLISH&target__s=Print&brand__s=WW Magazine&issue__s=2018-Feb&published__dt=2018-02-20"
```

Now refreshing the panel would allow you to search on publication date, brand, issue and target. When you click on any of the assets, you will see it's publication details.

Log ingestion note: Make sure that the data you log is always in the same format. This ensures that there are no "similar" values in the panel search field. For example an issue called "Feb-2018" or "February 2018".

Developer note: The published in panel now uses the typical WoodWing Enterprise publication fields (brand, issue, etc). It is however possible to add/use your own fields. There is no special configuration required for the fields you store in Elvis as the stats index dynamically indexes data you feed to it. You would however need to customize the stats search API and the published in panel in this project. 

# 5. Using the API

This section describes the available API calls. The URL's assume you've installed the Stats API plugin and are relative to the Elvis Server URL. All examples require you to authenticate against Elvis and [pass proper authentication info](https://helpcenter.woodwing.com/hc/en-us/articles/115003742263-Elvis-6-REST-API-Performing-a-POST-160-request-with-a-csrf-token) using the [api login](https://helpcenter.woodwing.com/hc/en-us/articles/115004785283-Elvis-6-REST-API-API-login) method.

Note: You don't need to pass authentication info when calling the stats API from a web client plug-in as the Elvis Server already takes care of this.

## 5.1 GET `/plugin/stats_api/folder-stats`

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

## 5.2 GET `/plugin/stats_api/detect-duplicates`

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

## 5.3 GET `/plugin/stats_api/usage`

Search Elvis usage stats over a period of time.

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

## 5.4 GET `/plugin/stats_api/publish/stats/:assetId:`

Retrieve publication history for a given assetId.

Request:
```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... n9g" -X GET "http://localhost:8080/plugins/stats_api/stats/1MhlfbUDKDU8HGE9db0zdv"
```

Response:
```
[
    {
        "assetId": "1uPJ6RCmqxN9oTfI8crOpX",
        "brand": "WW Newsweek",
        "issue": "2017-51",
        "target": "Print",
        "published": "2017-12-18"
    },
    {
        "assetId": "1uPJ6RCmqxN9oTfI8crOpX",
        "brand": "WW Newsweek",
        "target": "Facebook",
        "published": "2017-12-17"
    }
    {
        "assetId": "1uPJ6RCmqxN9oTfI8crOpX",
        "brand": "WW Newsweek",
        "issue": "2017-50",
        "target": "Print",
        "published": "2017-12-11"
    }
]
```

## 5.5 GET `/plugin/stats_api/publish/statsSearch`

Retrieve stats categories and records for a given search.

Query parameters:
- action (optional - string): The action to search for, by default CUSTOM_ACTION_PUBLISH
- brand (optional - string): Brand name (Magazine A, Newspaper B, Book C, ...)
- issue (optional - string): Issue name (January 2018, Q2, Week 23, ...)
- target (optional - string): Target channel (Web, Print, App, Facebook, Instagram, Twitter, ...)
- startDate (optional - date: Publication stats start date in yyyy-mm-dd format
- endDate (optional - date): Publication stats end date in yyyy-mm-dd format

In this example we show how to retrieve publication info for all assets published to `Print` in `November 2017`.

Request:
```bash
$ curl -H "Content-Type: application/json" -H "Authorization: Bearer eyJ ... n9g" -X GET "http://localhost:8080/plugins/stats_api/statsSearch?action=CUSTOM_ACTION_PUBLISH&target=Print&startDate=2017-11-01&endDate=2017-11-30"
```

Response:
```
{
    "hits": [
        {
            "assetId": "DTKHBm944l-B3nFIUZgcye",
            "brand": "WW Magazine",
            "target": "Website",
            "published": "2017-11-08"
        },
        ...
        {
            "assetId": "52tFJ49t4G69i-LGK1lD6E",
            "brand": "WW Magazine",
            "target": "Website",
            "published": "2017-11-26"
        },
    ],
    "facets": {
        "brand": [
            {
                "name": "WW Magazine",
                "count": 723
            },
            {
                "name": "WW Newsweek",
                "count": 456
            }
        ],
        "issue": [
            {
                "name": "2017-48",
                "count": 262
            },
            {
                "name": "2017-47",
                "count": 227
            }
        ],
        "target": [
            {
                "name": "Print",
                "count": 678
            },
            {
                "name": "Website",
                "count": 498
            }
        ]
    }
}
```


# 6. Version history

## v2.0.0
- Added published-in panel + API

## v1.0.0
- folder-stats API
- detect-duplicates API
- usage API
- folder stats plug-in
- duplicate report plug-in
