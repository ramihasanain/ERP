# ADEX ERP API Reference

- Source: ADEX erp.postman_collection.json
- Total endpoints: 34

Sorted by location (Postman folders), then endpoint path.

## Auth

### 1. login
- Type: POST
- Endpoint: /api/login/
- Usage: Create/authenticate
- Body (raw):
```json
{
  "email":"zeyadslama23@gmail.com",
  "password":"Test@123"
}
```

### 2. register
- Type: POST
- Endpoint: /api/register/
- Usage: Create/authenticate
- Body (raw):
```json
{
  "full_name": "demohome233",
  "email": "demohome233@gmail.com",
  "password": "Test@123",
  "company_name": "demohome233",
  "industry": "d63cb5db-3c80-47b7-93b0-4e73356b6efb",
  "country": "6cb76803-0233-4ab0-b903-f743244a5ad9",
  "base_currency": "cd61bd7d-a343-49a6-a09a-900bc6207e6e",
  "default_language": "dcb5edbd-abb0-476f-a15d-a0d6e0cb826a",
  "selected_modules": [
    "8ec4b0a6-70ee-4b07-8e32-94b78773d703",
    "9d65d7c5-d127-44f3-902c-92d4691a5e1a",
    "531e9aff-d850-49c8-bc28-8957bbf7cbdc"
  ]
}
```

## Profile

### 3. me
- Type: GET
- Endpoint: /api/me/
- Usage: Fetch single record/details
- Params (query): none

### 4. me
- Type: PUT
- Endpoint: /api/me/
- Usage: Fetch single record/details
- Body (formdata):
```json
[
  {
    "key": "full_name",
    "value": "Zeyad Salama",
    "type": "text"
  },
  {
    "key": "image",
    "type": "file",
    "src": "/home/demo/Downloads/u1.jpg"
  }
]
```

## Shared > Account Types

### 5. List Account Types
- Type: GET
- Endpoint: /api/shared/account-types/
- Usage: List records
- Params (query): none

## Shared > Countries

### 6. countries
- Type: GET
- Endpoint: /api/shared/countries/?name=jor
- Usage: Fetch data
- Params (query):
  - name - required (example: jor)

## Shared > Currencies

### 7. currencies
- Type: GET
- Endpoint: /api/shared/currencies/?name=jor
- Usage: Fetch data
- Params (query):
  - name - required (example: jor)

## Shared > Industries

### 8. industries
- Type: GET
- Endpoint: /api/tenants/industries/
- Usage: Fetch data
- Params (query): none

## Shared > Languages

### 9. languages
- Type: GET
- Endpoint: /api/shared/languages/
- Usage: Fetch data
- Params (query): none

## Shared > Modules

### 10. modules
- Type: GET
- Endpoint: /api/shared/modules/
- Usage: Fetch data
- Params (query): none

## Tennant > Accounting > Accounts

### 11. List Accounts
- Type: GET
- Endpoint: /accounting/accounts/
- Usage: List records
- Params (query):
  - page - optional (example: 1)
  - account_type - optional (example: cost of goods sold)
  - is_system_account - optional (example: false)

### 12. Create Accounts
- Type: POST
- Endpoint: /accounting/accounts/create/
- Usage: Create/authenticate
- Body (raw):
```json
{
  "code": "412",    
  "name": "{{$randomBankAccountName}}",
  "description": "Small tools and consumables",
  "account_type": "fd074380-43dc-4948-824a-53256f6d1080",
  "parent": "bfcb72be-94c4-4588-9092-6031bc982f9f",
  "is_active": false,
  "order": 10
}
```

### 13. List Accounts tree
- Type: GET
- Endpoint: /accounting/accounts/tree?is_system_account=false
- Usage: List records
- Params (query):
  - page - optional (example: 1)
  - account_type - optional (example: 7a6aa490-acff-4b44-968c-d6813677d178)
  - is_system_account - required (example: false)

## Tennant > Accounting > Journal Enteries

### 14. List journal enteries
- Type: GET
- Endpoint: /accounting/journal-entries/
- Usage: List records
- Params (query): none

### 15. Update journal entery
- Type: PUT
- Endpoint: /accounting/journal-entries/132be754-4b02-4529-bfb8-5b05f8dc9692/
- Usage: Update existing record
- Body (raw):
```json
{
  "date": "2026-04-11",
  "reference": "INV-2026-0042-rev1",
  "description": "Office supplies (corrected)",
  "currency": "JOD",
  "lines": [
    {
      "id": "352c9fb4-aff4-46c6-9535-df4ab44a4b0c",
      "account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
      "description": "Expense — supplies",
      "cost_center": null,
      "debit": "175.50",
      "credit": "0.00",
      "order": 0
    }
  ]
}
```

### 16. Journal Entry details
- Type: GET
- Endpoint: /accounting/journal-entries/b1ebb239-617b-40d3-aca4-b10c3bc9da4f/
- Usage: Fetch single record/details
- Params (query): none

### 17. Create journal entery
- Type: POST
- Endpoint: /accounting/journal-entries/create/
- Usage: Create/authenticate
- Body (raw):
```json
{
    "date": "2026-04-12",
    "reference": "INV-2026-0042",
    "description": "Office supplies",
    "currency": "JOD",
    "lines": [
        {
            "account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
            "description": "Expense — supplies",
            "cost_center": null,
            "debit": "150.00",
            "credit": "0.00",
            "order": 0
        },
        {
            "account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
            "description": "Expense — supplies",
            "cost_center": null,
            "debit": "250.00",
            "credit": "0.00",
            "order": 0
        },
        {
            "account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
            "description": "Expense — supplies",
            "cost_center": null,
            "debit": "0.00",
            "credit": "50.00",
            "order": 0
        }
    ]
}
```

## Tennant > HR > Departments

### 18. Department List
- Type: GET
- Endpoint: /api/hr/departments/
- Usage: List records
- Params (query): none

### 19. Department details
- Type: GET
- Endpoint: /api/hr/departments/a0ad0319-498a-4ef4-8048-f7c16e5a61ee/
- Usage: Fetch single record/details
- Params (query): none

### 20. Department update
- Type: PUT
- Endpoint: /api/hr/departments/a0ad0319-498a-4ef4-8048-f7c16e5a61ee/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "name": "SW Development",
  "parent": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
  "head": "1"
}
```

### 21. Create Department
- Type: POST
- Endpoint: /api/hr/departments/create/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "name": "test dep",
//   "parent": "6aa8523b-e071-4516-a0a8-d65ab250e0a0",
  "head": "1"
}
```

### 22. Department update Copy
- Type: DELETE
- Endpoint: /api/hr/departments/d6569f4d-ca38-4ae5-8b5f-e419dca26820/delete/
- Usage: Fetch single record/details

### 23. Department List tree
- Type: GET
- Endpoint: /api/hr/departments/tree
- Usage: List records
- Params (query): none

## Tennant > HR > Postions

### 24. List Positions
- Type: GET
- Endpoint: /api/hr/positions/
- Usage: List records
- Params (query): none

### 25. Create Positions
- Type: POST
- Endpoint: /api/hr/positions/create/
- Usage: Create/authenticate
- Body: not provided in collection

### 26. Position details
- Type: GET
- Endpoint: /api/hr/positions/id/
- Usage: Fetch single record/details
- Params (query): none

### 27. Position update
- Type: PUT
- Endpoint: /api/hr/positions/id/
- Usage: Update existing record
- Body: not provided in collection

### 28. Position update Copy
- Type: DELETE
- Endpoint: /api/hr/positions/id/delete/
- Usage: Update existing record

## Tennant > Inventory > Product

### 29. Product Create
- Type: POST
- Endpoint: /api/inventory/products/create/
- Usage: Create/authenticate
- Body (raw):
```json
{
    "name": "Laptop Dell XPS 13",
    "sku": "DELL-XPS-13",
    "category": "c13189ba-042d-428a-94e5-fc4e679d5bcb",
    "type": "stock_item",
    "description": "13-inch ultrabook",
    "unit": "8d878db3-af52-42a2-aa58-8c49365aeb6f",
    "cost_price": "800.00",
    // "tax_rule": 2,
    "selling_price": "1000.00",
    // "revenue_account": 10,
    //   "inventory_asset_account": 20,
    "reorder_level": 5,
    "is_active": true
}
```

## Tennant > Inventory > Wearhouses

### 30. List wearhouse
- Type: GET
- Endpoint: /api/inventory/warehouses/
- Usage: List records
- Params (query): none

### 31. warehouse delete
- Type: DELETE
- Endpoint: /api/inventory/warehouses/b230be85-635b-4dd6-be76-e28f56850cd2/
- Usage: Delete record

### 32. warehouse details
- Type: GET
- Endpoint: /api/inventory/warehouses/b230be85-635b-4dd6-be76-e28f56850cd2/
- Usage: Fetch single record/details
- Params (query): none

### 33. warehouse update
- Type: PUT
- Endpoint: /api/inventory/warehouses/b230be85-635b-4dd6-be76-e28f56850cd2/
- Usage: Update existing record
- Body (raw):
```json
{
  "name": "Main Warehouse - Updated",
  "location": "Algalaa st., Cairo", 
  "manager": 1
}
```

### 34. Create warehouse
- Type: POST
- Endpoint: /api/inventory/warehouses/create/
- Usage: Create/authenticate
- Body (raw):
```json
{
  "name": "Main Warehouse",
  "location": "123 Industrial Ave, Riyadh",
  "manager": "1"
}
```
