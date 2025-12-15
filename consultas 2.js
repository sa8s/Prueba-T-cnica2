[{
    $match: {
      Codigoticket: "TKT-2024-001"
    }
  },
  {
    $project:
      {
        _id: 0,
        Codigoticket: 1,
        estado: 1,
        historial: 1
      }
  },
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
    $match:
      {
        "ultimoestado.actionType": {
          $in: ["state_change", "creation"]
        }
      }
  },
  {
    $group:

      {
        _id: null,
        Cantidad_de_ingresos: {
          $sum: 1
        }
      }
  }
]   