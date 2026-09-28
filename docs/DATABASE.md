# Base de datos de ClimaClaro

ClimaClaro tiene su propia base de datos independiente.

No debe fusionarse con la base de datos de ClimaPlan.

## Entidades principales

## Product

Campos recomendados:

- id
- brand
- model
- name
- slug
- description
- power_kw
- frigories
- energy_class
- wifi
- price
- installation_price
- image_url
- datasheet_url
- active
- created_at
- updated_at

## Service

Campos recomendados:

- id
- name
- slug
- description
- base_price
- service_type
- active

## Lead

Campos recomendados:

- id
- name
- email
- phone
- source
- wizard_data
- notes
- created_at
- updated_at

## Customer

Campos recomendados:

- id
- name
- email
- phone
- address
- postal_code
- city
- province
- created_at
- updated_at

## Quote

Campos recomendados:

- id
- quote_number
- customer_id
- lead_id
- status
- subtotal
- tax_rate
- tax_amount
- total
- valid_until
- pdf_url
- notes
- accepted_at
- created_at
- updated_at

Estados:

- draft
- sent
- accepted
- rejected
- expired

Numeración:

- PRES-YYYY-0001

## QuoteItem

Campos recomendados:

- id
- quote_id
- type
- name
- description
- quantity
- unit_price
- tax_rate
- total
- product_id
- service_id

## ReservationRequest

Solicitud de reserva desde web.

Campos recomendados:

- id
- customer_id
- quote_id
- preferred_date
- time_slot
- address
- postal_code
- city
- province
- notes
- status
- created_at
- updated_at

Estados:

- pending
- confirmed
- rejected

## EditableContent

Textos editables.

Campos recomendados:

- id
- key
- title
- content
- section
- updated_at

Ejemplos:

- home_text
- installation_conditions
- warranty
- returns_policy
- about_us
- quote_terms

## Asset

Campos recomendados:

- id
- name
- type
- url
- storage_path
- mime_type
- size
- related_entity
- related_id
- created_at

Tipos:

- image
- pdf
- icon
- datasheet
- legal
