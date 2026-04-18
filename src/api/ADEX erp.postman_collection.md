# ADEX ERP API Reference

- Source: ADEX erp.postman_collection.json
- Total endpoints: 78

Sorted by location (Postman folders), then endpoint path.

## Profile

### 1. me
- Type: GET
- Endpoint: /api/me/
- Usage: List records
- Params (query): none

### 2. me
- Type: PUT
- Endpoint: /api/me/
- Usage: Update existing record
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
- Params (query): none


## Shared > Currencies

### 3. currencies
- Type: GET
- Endpoint: /api/shared/currencies/?name=egy
- Usage: Fetch single record/details
- Params (query):
  - name - required (example: egy)


## Shared > Countries

### 4. countries
- Type: GET
- Endpoint: /api/shared/countries/?name=jor
- Usage: Fetch single record/details
- Params (query):
  - name - required (example: jor)


## Shared > Languages

### 5. languages
- Type: GET
- Endpoint: /api/shared/languages/
- Usage: List records
- Params (query): none


## Shared > Modules

### 6. modules
- Type: GET
- Endpoint: /api/shared/modules/
- Usage: List records
- Params (query): none


## Shared > Industries

### 7. industries
- Type: GET
- Endpoint: /api/tenants/industries/
- Usage: List records
- Params (query): none


## Shared > Account Types

### 8. List Account Types
- Type: GET
- Endpoint: /api/shared/account-types/
- Usage: Fetch single record/details
- Params (query): none


## Shared

### 9. Boot strap data
- Type: GET
- Endpoint: /api/shared/bootstrap-data/
- Usage: Fetch single record/details
- Params (query): none


## Auth

### 10. login
- Type: POST
- Endpoint: /api/login/
- Usage: Create record
- Body (raw):
```json
{
  "email":"zeyadslama23@gmail.com",
  "password":"Test@123"
}
```
- Params (query): none

### 11. login employee -- only for testing purpose
- Type: POST
- Endpoint: /api/login/
- Usage: Create record
- Body (raw):
```json
{
  "email":"employee11@zeyad.localhost",
  "password":"Da5W1PcbZ4Zw"
}
```
- Params (query): none

### 12. register
- Type: POST
- Endpoint: /api/register/
- Usage: Create record
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
- Params (query): none


## Tennant > Accounting > Accounts

### 13. List Accounts
- Type: GET
- Endpoint: /accounting/accounts/
- Usage: Fetch single record/details
- Params (query):
  - page - optional (example: 1)
  - account_type - optional (example: cost of goods sold)
  - is_system_account - optional (example: false)

### 14. List Accounts tree
- Type: GET
- Endpoint: /accounting/accounts/tree?is_system_account=false
- Usage: Fetch single record/details
- Params (query):
  - page - optional (example: 1)
  - account_type - optional (example: 7a6aa490-acff-4b44-968c-d6813677d178)
  - is_system_account - required (example: false)

### 15. Create Accounts
- Type: POST
- Endpoint: /accounting/accounts/create/
- Usage: Create record
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
- Params (query): none


## Tennant > Accounting > Journal Enteries

### 16. Create journal entery
- Type: POST
- Endpoint: /accounting/journal-entries/create/
- Usage: Create record
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
- Params (query): none

### 17. List journal enteries
- Type: GET
- Endpoint: /accounting/journal-entries/
- Usage: Fetch single record/details
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
        }
    ]
}
```
- Params (query): none

### 18. Update journal entery
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
- Params (query): none

### 19. Journal Entry details
- Type: GET
- Endpoint: /accounting/journal-entries/b1ebb239-617b-40d3-aca4-b10c3bc9da4f/
- Usage: Fetch single record/details
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
- Params (query): none


## Tennant > HR > Departments

### 20. Create Department
- Type: POST
- Endpoint: /api/hr/departments/create/
- Usage: Create record
- Body (raw):
```json
{
  "name": "test dep",
//   "parent": "6aa8523b-e071-4516-a0a8-d65ab250e0a0",
  "head": "1"
}
```
- Params (query): none

### 21. Department List
- Type: GET
- Endpoint: /api/hr/departments/
- Usage: List records
- Params (query): none

### 22. Department List tree
- Type: GET
- Endpoint: /api/hr/departments/tree
- Usage: List records
- Params (query): none

### 23. Department details
- Type: GET
- Endpoint: /api/hr/departments/a0ad0319-498a-4ef4-8048-f7c16e5a61ee/
- Usage: Fetch single record/details
- Params (query): none

### 24. Department update
- Type: PUT
- Endpoint: /api/hr/departments/a0ad0319-498a-4ef4-8048-f7c16e5a61ee/
- Usage: Update existing record
- Body (raw):
```json
{
  "name": "SW Development",
  "parent": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
  "head": "1"
}
```
- Params (query): none

### 25. Department update Copy
- Type: DELETE
- Endpoint: /api/hr/departments/d6569f4d-ca38-4ae5-8b5f-e419dca26820/delete/
- Usage: Delete record
- Body (raw):
```json
{
  "name": "SW Development",
  "parent": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
  "head": "1"
}
```
- Params (query): none


## Tennant > HR > Postions

### 26. List Positions
- Type: GET
- Endpoint: /api/hr/positions/
- Usage: List records
- Params (query): none

### 27. Position details
- Type: GET
- Endpoint: /api/hr/positions/1c54c62b-7572-4d6b-8a01-b0169f0f7ed8/
- Usage: Fetch single record/details
- Params (query): none

### 28. Position update
- Type: PUT
- Endpoint: /api/hr/positions/1c54c62b-7572-4d6b-8a01-b0169f0f7ed8/
- Usage: Update existing record
- Body (raw):
```json
{
  "name": "Senior Backend Engineer",
  "description": "Handles backend related authentication and authorization and creates APIs for the frontend team to interact with the backend services.",
  "department": "df6eb4c0-b809-4954-9ffb-0062d45866f8"
}
```
- Params (query): none

### 29. Position update Copy
- Type: DELETE
- Endpoint: /api/hr/positions/id/delete/
- Usage: Delete record
- Params (query): none

### 30. Create Position
- Type: POST
- Endpoint: /api/hr/positions/create/
- Usage: Create record
- Body (raw):
```json
{
  "name": "Jounir Software Engineer",
  "description": "Handles backend related authentication and authorization and creates APIs for the frontend team to interact with the backend services.",
  "department": "6aa8523b-e071-4516-a0a8-d65ab250e0a0"
}
```
- Params (query): none


## Tennant > HR > Employee Module > Employee CRUDS

### 31. Create Employee
- Type: POST
- Endpoint: /api/hr/employees/create/
- Usage: Create record
- Body (raw):
```json
{
  "user_data": {
    "email": "employee11@zeyad.localhost",
    "first_name": "Jackal",
    "last_name": "Killer"
  },
  "profile_data": {
    "date_of_birth": "1995-08-15",
    "nationality": "Egyptian",
    "phone_number": "+204234563890",
    "address": "Cairo, Egypt",
    "department": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
    "position": "1c54c62b-7572-4d6b-8a01-b0169f0f7ed8",
    "joining_date": "2026-04-14",
    "status": "active",
    "bank_name": "National Bank",
    "account_number": "4234567390",
    "iban": "EG380010000500000300263189002"
  }
}
```
- Params (query): none
- Related employee endpoints (from Employee Module > Leavs):
  - POST /api/hr/employees/leaves/create/ (create leave request)
  - GET /api/hr/employees/leaves/ (list own leave requests)
  - GET /api/hr/employees/documents/ (list own documents)
  - POST /api/hr/employees/documents/upload/ (upload document)

### 32. Employee change_passowrd_first_time
- Type: POST
- Endpoint: /api/change-password-first-login/
- Usage: Create record
- Body (raw):
```json
{
    "current_password": "zMx889ye37ch",
    "new_password": "NewStrongPass123!",
    "confirm_password": "NewStrongPass123!"
}
```
- Params (query): none

### 33. List Employees
- Type: GET
- Endpoint: /api/hr/employees/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "user_data": {
    "email": "employee12@zeyad.localhost",
    "first_name": "John",
    "last_name": "Doe"
  },
  "profile_data": {
    "date_of_birth": "1995-08-15",
    "nationality": "Egyptian",
    "phone_number": "+201234567890",
    "address": "Cairo, Egypt",
    "department": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
    "position": "1c54c62b-7572-4d6b-8a01-b0169f0f7ed8",
    "joining_date": "2026-04-14",
    "status": "active",
    "bank_name": "National Bank",
    "account_number": "1234567890",
    "iban": "EG380019000500000000263189002"
  }
}
```
- Params (query):
  - position - optional (example: 1c54c62b-7572-4d6b-8a01-b0169f0f7ed8)
  - department - optional (example: 6aa8523b-e071-4516-a0a8-d65ab250e0a0)
  - status - optional (example: active)

### 34. Employee details
- Type: GET
- Endpoint: /api/hr/employees/2eb715a0-1475-4bfc-9ab4-672412fa7c2a/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "user_data": {
    "email": "employee12@zeyad.localhost",
    "first_name": "John",
    "last_name": "Doe"
  },
  "profile_data": {
    "date_of_birth": "1995-08-15",
    "nationality": "Egyptian",
    "phone_number": "+201234567890",
    "address": "Cairo, Egypt",
    "department": "df6eb4c0-b809-4954-9ffb-0062d45866f8",
    "position": "1c54c62b-7572-4d6b-8a01-b0169f0f7ed8",
    "joining_date": "2026-04-14",
    "status": "active",
    "bank_name": "National Bank",
    "account_number": "1234567890",
    "iban": "EG380019000500000000263189002"
  }
}
```
- Params (query): none

### 35. Update Employee
- Type: PUT
- Endpoint: /api/hr/employees/2eb715a0-1475-4bfc-9ab4-672412fa7c2a/
- Usage: Update existing record
- Body (raw):
```json
{
  "user_data": {
    "email": "demo@zeyad.localhost",
    "first_name": "Demo",
    "last_name": "Home"
  },
  "profile_data": {
    "date_of_birth": "1992-06-15",
    "nationality": "Jordanian",
    "phone_number": "+201234567890",
    "address": "Amman, Jordan",
    "department": "6aa8523b-e071-4516-a0a8-d65ab250e0a0",
    "position": "03d0eb16-b843-4548-a1bc-ddf8eba9fbfa",
    "joining_date": "2026-04-11",
    "status": "active",
    "reset_password_required": false,
    "bank_name": "ABC Bank",
    "account_number": "1234567899",
    "iban": "EG380019000500000000463189002"
  }
}
```
- Params (query): none


## Tennant > HR > Employee Module > Salaries & Contracts

### 36. List Salary Structures
- Type: GET
- Endpoint: /api/hr/salary-structures/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "a3d1f8b9-8a39-4b9a-9e34-9f0f0f0f0f01"
  },
  "compensation_data": {
    "structure": "b7c2a1d3-6f21-4e51-8af9-1d2d2d2d2d02",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none

### 37. List Contract Templates
- Type: GET
- Endpoint: /api/hr/contract-templates/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "a3d1f8b9-8a39-4b9a-9e34-9f0f0f0f0f01"
  },
  "compensation_data": {
    "structure": "b7c2a1d3-6f21-4e51-8af9-1d2d2d2d2d02",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none

### 38. Save contract compensation
- Type: POST
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/contract-compensation/
- Usage: Create record
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "c65b5860-8ffd-4faa-a4c9-9c679c6af9d8"
  },
  "compensation_data": {
    "structure": "7505dd0c-9706-4be1-9e5b-cba5ead0cadc",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none

### 39. update contract / compensation
- Type: PUT
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/contract-compensation/
- Usage: Update existing record
- Body (raw):
```json
{
  "compensation_data": {
    // "structure": "7505dd0c-9706-4be1-9e5b-cba5ead0cadc",
    "basic_salary": "4500.00",
    "currency": "JOD",
    "transportation": "50.00",
    "housing": "50.00",
    "other_allowances": "300.00",
    "social_security": "900.00",
    "health_insurance": "350.00",
    "other_deductions": "250.00"
  },
  "contract_data": {
    "contract_type": "part_time",
    "start_date": "2026-09-01",
    "end_date": "2027-05-01",
    "annual_leave_days": 12
    // "template": "c65b5860-8ffd-4faa-a4c9-9c679c6af9d8"
  }
}
```
- Params (query): none

### 40. Delete contract from contract history
- Type: DELETE
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/history/contracts/537baca1-fa59-4e66-85ea-bc6bbce884d6/delete/
- Usage: Delete record
- Params (query): none

### 41. Create salary increase
- Type: POST
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/salary-increases/
- Usage: Create record
- Body (raw):
```json
{
  "effective_date": "2026-05-01",
  "new_basic_salary": "1350.00",
  "reason": "Annual increment"
}
```
- Params (query): none

### 42. Create performance evaluation
- Type: POST
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/evaluations/
- Usage: Create record
- Body (raw):
```json
{
  "review_period_start": "2026-01-01",
  "review_period_end": "2026-03-31",
  "job_knowledge": 4,
  "work_quality": 5,
  "attendance": 4,
  "communication": 4,
  "initiative": 5,
  "comments": "Strong performance this quarter."
}
```
- Params (query): none

### 43. Employee Salary & Contract history
- Type: GET
- Endpoint: /api/hr/employees/a47ddfbf-2231-4b67-be6d-034f6a7563d7/history/
- Usage: List records
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "a3d1f8b9-8a39-4b9a-9e34-9f0f0f0f0f01"
  },
  "compensation_data": {
    "structure": "b7c2a1d3-6f21-4e51-8af9-1d2d2d2d2d02",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none

### 44. List Expiring Soon Contracts
- Type: GET
- Endpoint: /api/hr/contracts/expiring-soon/
- Usage: List records
- Params (query): none


## Tennant > HR > Employee Module > Leavs > Employee

### 45. Create Leaves request for employee --  employee should be the requesting user
- Type: POST
- Endpoint: /api/hr/employees/leaves/create/
- Usage: Create record
- Body (raw):
```json
{
  "leave_type": "annual",
  "start_date": "2026-05-10",
  "end_date": "2026-05-12",
  "days": 3,
  "notes": "Family travel"
}
```
- Params (query): none

### 46. List Leaves request for employee
- Type: GET
- Endpoint: /api/hr/employees/leaves/
- Usage: List records
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "a3d1f8b9-8a39-4b9a-9e34-9f0f0f0f0f01"
  },
  "compensation_data": {
    "structure": "b7c2a1d3-6f21-4e51-8af9-1d2d2d2d2d02",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none

### 47. Delete employee leave
- Type: DELETE
- Endpoint: /api/hr/employees/leaves/fbc664cf-cd97-4897-8780-73104c5ced64/approve/
- Usage: Delete record
- Params (query): none

### 48. Leaves request for employee Details
- Type: GET
- Endpoint: /api/hr/employees/leaves/fbc664cf-cd97-4897-8780-73104c5ced64/
- Usage: Fetch single record/details
- Body (raw):
```json
{
  "contract_data": {
    "contract_type": "full_time",
    "start_date": "2026-04-1",
    "end_date": "2027-04-14",
    "annual_leave_days": 14,
    "template": "a3d1f8b9-8a39-4b9a-9e34-9f0f0f0f0f01"
  },
  "compensation_data": {
    "structure": "b7c2a1d3-6f21-4e51-8af9-1d2d2d2d2d02",
    "basic_salary": "1200.00",
    "currency": "JOD",
    "transportation": "100.00",
    "housing": "150.00",
    "other_allowances": "50.00",
    "social_security": "80.00",
    "health_insurance": "30.00",
    "other_deductions": "20.00"
  }
}
```
- Params (query): none


## Tennant > HR > Employee Module > Leavs > Admin

### 49. List employee leavs
- Type: GET
- Endpoint: /api/hr/employees/47a0fc70-50e7-4c88-9dc4-58bd75f0492d/leaves/
- Usage: List records
- Params (query): none

### 50. Approve employee leaves
- Type: PUT
- Endpoint: /api/hr/employees/47a0fc70-50e7-4c88-9dc4-58bd75f0492d/leaves/fbc664cf-cd97-4897-8780-73104c5ced64/approve/
- Usage: Update existing record
- Params (query): none

### 51. Reject employee leaves
- Type: PUT
- Endpoint: /api/hr/employees/47a0fc70-50e7-4c88-9dc4-58bd75f0492d/leaves/0a32aef2-b299-46a9-a9f5-66f7158792f9/reject/
- Usage: Update existing record
- Params (query): none

### 52. Employee leaves Details
- Type: GET
- Endpoint: /api/hr/employees/47a0fc70-50e7-4c88-9dc4-58bd75f0492d/leaves/a3a402b6-e29b-48b3-b574-81538fedf33d/
- Usage: Fetch single record/details
- Params (query): none


## Tennant > HR > Employee Module > Leavs > Documents > Employee

### 53. List documents
- Type: GET
- Endpoint: /api/hr/employees/documents/
- Usage: List records
- Params (query): none

### 54. Upload documents
- Type: POST
- Endpoint: /api/hr/employees/documents/upload/
- Usage: Create record
- Body (formdata):
```json
[
  {
    "key": "name",
    "value": "CV",
    "type": "text"
  },
  {
    "key": "file",
    "type": "file",
    "src": "/home/demo/Documents/Zeyad_Salama_Sofrware_Engineer.pdf"
  }
]
```
- Params (query): none


## Tennant > HR > Employee Module > Leavs > Documents > Admin

### 55. List employee documents
- Type: GET
- Endpoint: /api/hr/employees/47a0fc70-50e7-4c88-9dc4-58bd75f0492d/documents/
- Usage: List records
- Params (query): none


## Tennant > Inventory > Wearhouses

### 56. List wearhouse
- Type: GET
- Endpoint: /api/inventory/warehouses/
- Usage: List records
- Params (query): none

### 57. Create warehouse
- Type: POST
- Endpoint: /api/inventory/warehouses/create/
- Usage: Create record
- Body (raw):
```json
{
  "name": "Main Warehouse",
  "location": "123 Industrial Ave, Riyadh",
  "manager": "1"
}
```
- Params (query): none

### 58. warehouse details
- Type: GET
- Endpoint: /api/inventory/warehouses/b230be85-635b-4dd6-be76-e28f56850cd2/
- Usage: Fetch single record/details
- Params (query): none

### 59. warehouse update
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
- Params (query): none

### 60. warehouse delete
- Type: DELETE
- Endpoint: /api/inventory/warehouses/b230be85-635b-4dd6-be76-e28f56850cd2/
- Usage: Delete record
- Params (query): none


## Tennant > Inventory > Product

### 61. Product Create
- Type: POST
- Endpoint: /api/inventory/products/create/
- Usage: Create record
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
- Params (query): none

### 62. Products list
- Type: GET
- Endpoint: /api/inventory/products/?category=c13189ba-042d-428a-94e5-fc4e679d5bcb
- Usage: Fetch single record/details
- Params (query):
  - category - required (example: c13189ba-042d-428a-94e5-fc4e679d5bcb)

### 63. Product Update
- Type: PUT
- Endpoint: /api/inventory/products/8aee28ef-6c3c-4f44-ba8c-fc1135fecf36/
- Usage: Update existing record
- Body (raw):
```json
{
    "name": "Updated Laptop",
    "sku": "DELL-XPS-13-NEW",
    // "category": "c13189ba-042d-428a-94e5-fc4e679d5bcb",
    "type": "stock_item",
    "description": "Updated description",
    "unit": "8d878db3-af52-42a2-aa58-8c49365aeb6f",
    "cost_price": "850.00",
    "selling_price": "1100.00",
    // "tax_rule": 2,
    "reorder_level": 10,
    // "revenue_account": 10,
    // "inventory_asset_account": 20,
    "is_active": true
}
```
- Params (query): none

### 64. Product Details
- Type: GET
- Endpoint: /api/inventory/products/8aee28ef-6c3c-4f44-ba8c-fc1135fecf36/
- Usage: Fetch single record/details
- Params (query): none

### 65. Product Delete
- Type: DELETE
- Endpoint: /api/inventory/products/8aee28ef-6c3c-4f44-ba8c-fc1135fecf36/
- Usage: Delete record
- Params (query): none


## Tennant > Settings > General

### 66. Company Profile Details
- Type: GET
- Endpoint: /api/tenants/clients/settings/
- Usage: List records
- Params (query): none

### 67. Company Profile Update
- Type: PATCH
- Endpoint: /api/tenants/clients/settings/
- Usage: Update existing record
- Body (raw):
```json
{
    "company_name": "zeyadd",
    "tax_id": "",
    "industry": "d63cb5db-3c80-47b7-93b0-4e73356b6efb",
    "default_currency": "b03ed094-c56f-4d58-b563-2407f4c4977d",
    "date_format": "DD/MM/YYYY",
    "timezone": "Africa/Egypt"
}
```
- Params (query): none


## Tennant > Settings > Tax Rate

### 68. List tax-rules
- Type: GET
- Endpoint: /api/sales/tax-rules/
- Usage: Fetch single record/details
- Body (raw):
```json
{
    "company_name": "zeyadd",
    "tax_id": "",
    "industry": "d63cb5db-3c80-47b7-93b0-4e73356b6efb",
    "default_currency": "b03ed094-c56f-4d58-b563-2407f4c4977d",
    "date_format": "DD/MM/YYYY",
    "timezone": "Africa/Egypt"
}
```
- Params (query): none

### 69. Create tax-rule
- Type: POST
- Endpoint: /api/sales/tax-rules/create/
- Usage: Create record
- Body (raw):
```json
{
  "name": "Standard VAT 16%",
  "rate_percent": "20.00",
  "tax_type": "standard",
  "sales_gl_account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
  "purchase_gl_account": "bfcb72be-94c4-4588-9092-6031bc982f9f",
  "is_default": true
}
```
- Params (query): none

### 70. tax-rule details
- Type: GET
- Endpoint: /api/sales/tax-rules/70c43188-d0ab-4b8b-a124-30e24f14e552/
- Usage: Fetch single record/details
- Params (query): none

### 71. Update tax-rule
- Type: PUT
- Endpoint: /api/sales/tax-rules/70c43188-d0ab-4b8b-a124-30e24f14e552/
- Usage: Update existing record
- Body (raw):
```json
{
  "name": "Standard VAT 20%",
  "rate_percent": "20.00",
  "tax_type": "standard",
//   "sales_gl_account": "d20cbc2b-b5ec-4b7f-b295-011e79ccebec",
//   "purchase_gl_account": "bfcb72be-94c4-4588-9092-6031bc982f9f",
  "is_default": true
}
```
- Params (query): none

### 72. Delete tax_rule
- Type: DELETE
- Endpoint: /api/sales/tax-rules/70c43188-d0ab-4b8b-a124-30e24f14e552/
- Usage: Delete record
- Params (query): none


## Tennant > Settings > Categories

### 73. List category types
- Type: GET
- Endpoint: /api/inventory/category-types/
- Usage: List records
- Params (query): none

### 74. Create Category
- Type: POST
- Endpoint: /api/inventory/categories/create/
- Usage: Create record
- Body (raw):
```json
{
  "name": "Electronics",
  "type": "b4d4b2f9-7ea3-49e7-9fb9-f17a7f6d3e8a",
  "description": "Electronic devices and accessories",
  "is_active": true
}
```
- Params (query): none

### 75. List categories
- Type: GET
- Endpoint: /api/inventory/categories/
- Usage: List records
- Params (query): none

### 76. categories details
- Type: GET
- Endpoint: /api/inventory/categories/b48dd905-c2d9-4127-aa55-ef92df242662/
- Usage: Fetch single record/details
- Params (query): none

### 77. Category Update
- Type: PUT
- Endpoint: /api/inventory/categories/b48dd905-c2d9-4127-aa55-ef92df242662/
- Usage: Update existing record
- Body (raw):
```json
{
  "name": "Electronics & Gadgets",
  "description": "Updated category description",
  "is_active": true
}
```
- Params (query): none

### 78. Category Delete
- Type: DELETE
- Endpoint: /api/inventory/categories/b48dd905-c2d9-4127-aa55-ef92df242662/
- Usage: Delete record
- Params (query): none
