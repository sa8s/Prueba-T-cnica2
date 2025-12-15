[
  {
    $lookup: {
        //para la primera parte de la consulta se atraen las acciones a través  del id del ticket y se guarda en una lista "historial"
        //además de eso se organizan en orden de tiempo o "timestamp", lo cual en un caso real no haría falta ya que las acciones se harían de forma automática conforme avanza el tiempo de forma ordenada
      from: "acciones",
      let: {
        ticketId: "$_id"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$ticketId", "$$ticketId"]
            }
          }
        },
        {
          $sort: {
            timestamp: 1
          }
        }
      ],
      as: "historial"
    }
  },
  {
    //aquí para la segunda consulta se filtran las acciones que generaron cambios en el estado del ticket antes de la segunda fecha
    
    $addFields: {
      cambiosAntesDeFin: {
        $filter: {
          input: "$historial",
          as: "acc",
          cond: {
            $and: [
              {
                $in: [
                  "$$acc.actionType",
                  ["state_change", "creation"]
                ]
              },
              {
                $lte: [
                  "$$acc.timestamp",
                  ISODate("2025-03-31T23:59:59Z")
                ]
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {
        //aquí para la primera parte de la consulta se buscan las acciones de cambio de estado que estuvieron antes del inicio del periodo
      AntesPeriodo: {
        $filter: {
          input: "$historial",
          as: "acc",
          cond: {
            $and: [
              {
                $in: [
                  "$$acc.actionType",
                  ["state_change", "creation"]
                ]
              },
              {
                $lte: [
                  "$$acc.timestamp",
                  ISODate("2025-01-01T00:00:00Z")
                ]
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields:
      //aquí para conseguir el último estado antes de la primera o segunda fecha
      {
        ultimoestado: {
          $last: "$cambiosAntesDeFin"
        },//para la segunda parte de la consulta
        ultimoestadoantes: {
          $last: "$AntesPeriodo"
        }//para la primera parte de la consulta
      }
  },
  {
    $match: {
        //este match posee los dos casos para la primera consulta a través de dos criteiros
        //en caso de querer buscar la segunda consulta (tickets en el estado buscado antes de fin de periodo), se deshabilitaría este stage
      $or: [
        // Criterio A: Estaba activo JUSTO ANTES del período
        //esto ayuda en caso de que se haya abierto uno y no haya vuelto a estar activo durante el periodo
        {
          $expr: {
            $in: [
              "$ultimoestadoantes.actionDetails.to",
              ["open", "in_progress"]
            ]
          }
        },
        // Criterio B: Tuvo actividad DURANTE el período
        //este busca cualquier actividad que haya sido creacion de apertura o de cierre
        {
          historial: {
            $elemMatch: {
              actionType: {
                $in: ["state_change", "creation"]
              },
              timestamp: {
                $gte: ISODate(
                  "2025-01-01T00:00:00Z"//fecha inicio periodo
                ),
                $lte: ISODate(
                  "2025-03-31T23:59:59Z"//fecha final periodo, se podría crear como variable en otro stage pero preferí dejar estas ya que tienen todos los ejemplos
                )
              },
              $or: [
                {
                  "actionDetails.to": {
                    $in: ["open", "in_progress"]
                  }
                },
                {
                  "actionDetails.from": {
                    $in: ["open", "in_progress"]
                  }
                }
              ]
            }
          }
        }
      ]
    }
  },
  {
    $match: {
        //aquí para la segunda parte de la consulta, busca el o los estados antes del periodo
        //para consultar se escojen los estados entre los 4 en la lista
      "ultimoestado.actionDetails.to": {
        $in: [
          "closed",
          "open",
          "rejected",
          "in_progress"
        ]
      }
    }
  },
  {
    $match: {
            //en caso de no querer usar la fecha se retorna el estado actual
            //para consultar se escojen los estados entre los 4 en la lista
      estado: {
        $in: [
          "closed",
          "open",
          "rejected",
          "in_progress",
        ]
      }
    }
  },
  {
    $lookup: {
        //traer lista de clasificadores en un array, al hacerlo a través del id no genera ningun cambio buscar por nombre cuando esos cambian en los Clasificadores
        //y no hace que se busque por id o path
      from: "clasificadores",
      localField: "Clasificaciones.nodePath",
      foreignField: "_id",
      as: "Path"
    }
  },
  {
    $match: {
        //unos ejemplos de la busqueda con algunos nombres
  "Path.name":{
    $in: [
      "Software","Hardware","Mejora"
    ]
  }

}
  },
  {
    $project:
      //La projección final
      {
        _id: 0,
        Codigoticket: 1,
        estado: 1,
        Asignaciones: 1,
        Clasificaciones: 1,
        "Accion de estado antes de inicio de periodo":
          "$ultimoestadoantes",
        "Accion de estado antes de final de periodo":
          "$ultimoestado"
      }
  }
]

