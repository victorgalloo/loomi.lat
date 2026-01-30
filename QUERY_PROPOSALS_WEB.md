# Query para ver Propuestas Web en Supabase

## Query 1: Listar todas las propuestas web

```sql
SELECT 
  id,
  name,
  email,
  company_name,
  jsonb_array_elements(files) as file_item
FROM clients
WHERE files IS NOT NULL
  AND files::text LIKE '%isWebProposal%';
```

## Query 2: Ver propuestas web con detalles expandidos

```sql
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.email,
  c.company_name,
  file_item->>'id' as proposal_id,
  file_item->>'title' as proposal_title,
  file_item->>'category' as category,
  file_item->>'isWebProposal' as is_web_proposal,
  CASE 
    WHEN (file_item->>'htmlContent') IS NOT NULL 
    THEN LEFT(file_item->>'htmlContent', 100) || '...'
    ELSE NULL 
  END as html_content_preview,
  LENGTH(file_item->>'htmlContent') as html_content_length
FROM clients c,
  jsonb_array_elements(c.files) as file_item
WHERE file_item->>'isWebProposal' = 'true'
  AND file_item->>'category' = 'proposals'
ORDER BY c.name, file_item->>'title';
```

## Query 3: Contar propuestas web por cliente

```sql
SELECT 
  c.id,
  c.name,
  c.company_name,
  COUNT(*) as total_web_proposals
FROM clients c,
  jsonb_array_elements(c.files) as file_item
WHERE file_item->>'isWebProposal' = 'true'
  AND file_item->>'category' = 'proposals'
GROUP BY c.id, c.name, c.company_name
ORDER BY total_web_proposals DESC;
```

## Query 4: Ver el HTML completo de TODAS las propuestas web

```sql
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.email,
  c.company_name,
  file_item->>'id' as proposal_id,
  file_item->>'title' as proposal_title,
  file_item->>'htmlContent' as html_content_completo,
  file_item->>'fileUrl' as file_url,
  file_item->>'createdAt' as fecha_creacion
FROM clients c,
  jsonb_array_elements(c.files) as file_item
WHERE file_item->>'isWebProposal' = 'true'
  AND file_item->>'category' = 'proposals'
  AND (file_item->>'htmlContent') IS NOT NULL
ORDER BY c.name, file_item->>'title';
```

## Query 5: Ver el HTML completo de una propuesta específica

```sql
SELECT 
  c.name as client_name,
  file_item->>'title' as proposal_title,
  file_item->>'htmlContent' as html_content
FROM clients c,
  jsonb_array_elements(c.files) as file_item
WHERE file_item->>'isWebProposal' = 'true'
  AND file_item->>'category' = 'proposals'
  AND c.id = 'CLIENT_ID_AQUI'  -- Reemplaza con el ID del cliente
  AND file_item->>'id' = 'PROPOSAL_ID_AQUI';  -- Reemplaza con el ID de la propuesta
```

## Query 6: Nombre del cliente, nombre de la propuesta y HTML completo (para copiar fácilmente)

```sql
SELECT 
  c.name as nombre_cliente,
  file_item->>'title' as nombre_propuesta,
  file_item->>'htmlContent' as html_completo
FROM clients c,
  jsonb_array_elements(c.files) as file_item
WHERE file_item->>'isWebProposal' = 'true'
  AND file_item->>'category' = 'proposals'
  AND (file_item->>'htmlContent') IS NOT NULL
ORDER BY c.name, file_item->>'title';
```

**Esta query devuelve tres columnas: el nombre del cliente, el nombre de la propuesta y el HTML completo. Haz clic en la celda del HTML para copiarlo completo.**

