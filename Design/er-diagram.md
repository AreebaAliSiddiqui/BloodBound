\# Entity-Relationship Diagram (ERD) - Bloodbound



```mermaid

erDiagram

&#x20;   USERS ||--o| DONOR\_PROFILES : "has (if role=donor)"

&#x20;   USERS ||--o{ HOSPITAL\_REQUESTS : "creates (if role=hospital\_staff)"

&#x20;   USERS ||--o{ CAMPS : "organizes (if role=camp\_organizer)"

&#x20;   

&#x20;   DONOR\_PROFILES ||--o{ CAMP\_APPOINTMENTS : "books"

&#x20;   CAMPS ||--o{ CAMP\_APPOINTMENTS : "hosts"

&#x20;   

&#x20;   CAMPS ||--o{ BLOOD\_INVENTORY : "supplies"

&#x20;   HOSPITAL\_REQUESTS ||--o{ BLOOD\_INVENTORY : "claims"

&#x20;   

&#x20;   HOSPITAL\_REQUESTS ||--o{ MATCHING\_LOGS : "triggers"

&#x20;   DONOR\_PROFILES ||--o{ MATCHING\_LOGS : "receives"



&#x20;   USERS {

&#x20;       uuid user\_id PK

&#x20;       string name

&#x20;       string email

&#x20;       string password\_hash

&#x20;       enum role

&#x20;       string phone

&#x20;       timestamp created\_at

&#x20;   }



&#x20;   DONOR\_PROFILES {

&#x20;       uuid donor\_id PK

&#x20;       uuid user\_id FK

&#x20;       enum blood\_group

&#x20;       string city

&#x20;       decimal latitude

&#x20;       decimal longitude

&#x20;       date last\_donation\_date

&#x20;       boolean is\_eligible

&#x20;   }



&#x20;   HOSPITAL\_REQUESTS {

&#x20;       uuid request\_id PK

&#x20;       uuid hospital\_id FK

&#x20;       string patient\_identifier

&#x20;       enum blood\_group

&#x20;       enum component

&#x20;       int units\_required

&#x20;       enum urgency

&#x20;       enum status

&#x20;   }



&#x20;   CAMPS {

&#x20;       uuid camp\_id PK

&#x20;       uuid organizer\_id FK

&#x20;       string camp\_name

&#x20;       string location\_address

&#x20;       string city

&#x20;       timestamp start\_time

&#x20;       timestamp end\_time

&#x20;       int target\_units

&#x20;   }



&#x20;   CAMP\_APPOINTMENTS {

&#x20;       uuid appointment\_id PK

&#x20;       uuid camp\_id FK

&#x20;       uuid donor\_id FK

&#x20;       timestamp slot\_time

&#x20;       boolean attended

&#x20;   }



&#x20;   BLOOD\_INVENTORY {

&#x20;       uuid unit\_id PK

&#x20;       enum blood\_group

&#x20;       enum component

&#x20;       uuid source\_camp\_id FK

&#x20;       uuid allocated\_request\_id FK

&#x20;       date expiry\_date

&#x20;       boolean is\_available

&#x20;   }



&#x20;   MATCHING\_LOGS {

&#x20;       uuid log\_id PK

&#x20;       uuid request\_id FK

&#x20;       uuid donor\_id FK

&#x20;       timestamp alert\_sent\_at

&#x20;       string response\_status

&#x20;   }

