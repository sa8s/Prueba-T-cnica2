[
  {
    $lookup: {
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
    $addFields: {
        //igual que con la busqueda con limite de fecha
      Cantidad_de_ingresos: {
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
    $addFields: {
      ultimoestado: {
        $last: "$Cantidad_de_ingresos"
      }
    }
  },
  {
    $addFields: {//aquí ya que "ultimoestado" no es un array no se cuenta como en los de $filter, por ende se usa condicional para retornar valores
      Cantidad_ultimo_estado: {
        $cond: [
          {
            $in: [
              "$ultimoestado.actionDetails.to",
              ["open", "in_progress"]
            ]
          },
          1,
          0
        ]
      }
    }
  },
  {
    $addFields: {//de la misma forma que en la consulta principal, se retornan las acciones de state_change y creation comprendidos entre la primera y la segunda fecha
      reaperturasdurante: {
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
                $and: [
                  {
                    $gte: [
                      "$$acc.timestamp",
                      ISODate(
                        "2025-01-01T00:00:00Z"
                      )
                    ]
                  },
                  {
                    $lte: [
                      "$$acc.timestamp",
                      ISODate(
                        "2025-03-31T23:59:59Z"
                      )
                    ]
                  }
                ]
              },
              {
                $and: [
                  {
                    $in: [//aquí están los cambios con la anterior, ya no busca cualquiera que posea condiciones abiertas con un or sino que usa un and para forzarlo
                      "$$acc.actionDetails.to",
                      ["open", "in_progress"]
                    ]
                  },
                  {
                    $in: [
                      "$$acc.actionDetails.from",
                      ["closed", "rejected", null] // el null depende de si se hace la consulta de reaperturas o la de conteo de aperturas
                    ]
                  }
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
      cierresdurante: {//este hace lo mismo con le ligero cambio de el from y el to en el estado
        $filter: {
          input: "$historial",
          as: "acc",
          cond: {
            $and: [
              {
                $in: [
                  "$$acc.actionType",
                  ["state_change"]
                ]
              },
              {
                $and: [
                  {
                    $gte: [
                      "$$acc.timestamp",
                      ISODate(
                        "2025-01-01T00:00:00Z"
                      )
                    ]
                  },
                  {
                    $lte: [
                      "$$acc.timestamp",
                      ISODate(
                        "2025-03-31T23:59:59Z"
                      )
                    ]
                  }
                ]
              },
              {
                $and: [
                  {
                    $in: [
                      "$$acc.actionDetails.from",
                      ["open", "in_progress"]
                    ]
                  },
                  {
                    $in: [
                      "$$acc.actionDetails.to",
                      ["closed", "rejected"]
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {//aquí se hace lo mismo que con la fecha inicial pero cambiandola por la segunda
      Cantidad_de_ingresos_final: {
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
      estado_al_final: {
        $last: "$Cantidad_de_ingresos_final"
      }
    }
  },
  {
    $addFields: {
      Tickets_abiertos_al_final: {
        $cond: [
          {
            $in: [
              "$estado_al_final.actionDetails.to",
              ["open", "in_progress"]
            ]
          },
          1,
          0
        ]
      }
    }
  },
  {
    $group: {//calculo dy muestra de los resultados para comprobar que se cumple la igualdad
      _id: null,
      Cantidad_ingresos: {
        $sum: "$Cantidad_ultimo_estado"
      },
      Cantidad_cierres: {
        $sum: {
          $size: "$cierresdurante"
        }
      },
      Cantidad_reaperturas: {
        $sum: {
          $size: "$reaperturasdurante"
        }
      },
      Cantidad_abiertos_al_final: {
        $sum: "$Tickets_abiertos_al_final"
      }
    }
  }
]