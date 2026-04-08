GET
/api/admin/dashboard
대시보드 조회


관리자 메인 화면에 필요한 통계 데이터를 조회한다.

Parameters
Try it out
Name	Description
period
string
(query)
조회 기간

Available values : week, month, year

Default value : week


week
Responses
Code	Description	Links
200	
OK

Media type

*/*
Controls Accept header.
Example Value
Schema
{
  "success": true,
  "message": "string",
  "data": {
    "productCount": 0,
    "onSaleProductCount": 0,
    "readyProductCount": 0,
    "partnerCount": 0,
    "activePartnerCount": 0,
    "inactivePartnerCount": 0,
    "totalOrderCount": 0,
    "orderCount": 0,
    "cancelOrderCount": 0,
    "thisMonthTotalOrderCount": 0,
    "thisMonthOrderCount": 0,
    "thisMonthCancelOrderCount": 0,
    "partnerSales": [
      {
        "partnerName": "string",
        "productCount": 0,
        "orderCount": 0,
        "salesAmount": 0,
        "netProfit": 0
      }
    ],
    "categoryProducts": [
      {
        "categoryName": "string",
        "productCount": 0
      }
    ],
    "topProducts": [
      {
        "productName": "string",
        "orderCount": 0
      }
    ],
    "dailySales": [
      {
        "date": "2026-03-07",
        "orderCount": 0,
        "salesAmount": 0,
        "netProfit": 0
      }
    ]
  },
  "errorCode": "string"
}