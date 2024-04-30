import { Hono } from 'hono'
import {Client} from "@notionhq/client";
import {env} from "hono/adapter";

const app = new Hono()

/* Válida el NFC entregado */
app.get('/:nfc_id', async (c) => {
  const nfc_id = c.req.param('nfc_id')
  const { NOTION_API_KEY } = env<{ NOTION_API_KEY: string }>(c)
  const notion = new Client({ auth: NOTION_API_KEY });
  const databaseResponse = await notion.databases.query({
    database_id: 'a99a85ba5ca44834bd747cac820bb6e0',
    filter: {
      and: [
        {
          property: 'NFC ID',
          rich_text: {
            equals: nfc_id
          }
        },
        {
          property: 'Puesto de trabajo',
          select: {
            equals: 'Miembro'
          }
        },
        {
          property: 'Organización',
          multi_select: {
            contains: '✨ ExDev ✨'
          }
        }
      ]
    }
  });

  if(databaseResponse.results.length === 0) {
    return c.json({
      error: {
        mensaje: `No encontramos el tag ${nfc_id}!`,
        codigo: 1
      }
    }, 404)
  }

  const idPagina = databaseResponse.results[0].id

  const pageResponse: any = await notion.pages.retrieve({
    page_id: idPagina
  });

  const properties = pageResponse['properties']

  if(!properties) {
    return c.json({
      error: {
        mensaje: `No encontramos propiedades en la página!`,
        codigo: 2
      }
    }, 404)
  }

  const puesto = properties['Puesto de trabajo']['select']['name']
  const nombre = properties['Nombre']['title'][0]['plain_text']

  return c.json({
    nombre,
    puesto,
    nfc_id,
  })
})

export default app