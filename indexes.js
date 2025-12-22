db.acciones.createIndex({
  ticketId: 1,
  timestamp: 1
});//de los más usados para los lookups y los addFields que se basan en timestamps y Id

db.clasificadores.createIndex({
  rootId: 1
});//importante para comparar los tickets que poseen roots en común

db.tickets.createIndex({
  "Clasificaciones.nodePath": 1
});//cuando se usa el lookup de los clasificadores

db.tickets.createIndex({
  "ultimoestado.actionDetails.to": 1
});//para buscar estados específicos basados post lookup con acciones

db.tickets.createIndex({
  "estado": 1
});//principalmente para el match de estado antes de fecha actual, al generar 4 estados facilita la busqueda para pasar de busqueda lineal a maximo 2 iteraciones


//////////////////////////////////no usados o cancelados



db.tickets.createIndex({ 
  "estado": 1,
  "ultimoestado.actionDetails.to": 1 
});//no usado, ambos indices existen mejor por separado sin combinarlos

db.tickets.createIndex({
  "estado": 1,
  "ultimoestado.actionDetails.to": 1,
  "Clasificaciones.nodePath": 1
});//no usado, lo mismo que lo anterior

db.clasificadores.createIndex({ "name": 1 });//no usado ya que las que el lookup entre tickets y clasificadores se toman por Id

db.tickets.createIndex({
  "Clasificaciones.rootId": 1
});//no usado, se planeaba aplicar si tickets no tuviera un nodePath completo

db.tickets.createIndex({
  estado: 1,
  "Clasificaciones.nodePath": 1
});//no usado, intento de combinación de tickets

db.clasificadores.createIndex({
  rootId: 1,
  path: 1
});//no usado ya que el path en clasificadores no se tomó en cuenta al final
