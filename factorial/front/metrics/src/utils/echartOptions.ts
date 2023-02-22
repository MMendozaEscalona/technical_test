import { EChartsOption } from "echarts-for-react"

export type Serie = {
    type: string,
    name?: string,
    data: {
        value: number,
        average: number
    }[]
    color: string
}

export type XAxis = {
    type: string
    name?: string
    data: string[]
}

export type YAxis = {
    type: string
    name?: string
    data?: string[]
}

export const getOptionsToChart = (xAxis: XAxis, yAxis: YAxis, series: Serie[], keys: string[], title: string): EChartsOption => {
    return {
        title: {
            text: title,
            left: '8%'
        },
        legend: {
            data: keys,
          },
        tooltip: {
            trigger: "item",
            borderColor: "transparent",
            position: "top",
            formatter: function (params: { data: { average: any } }) {
                return `Average: ${params.data.average}`;
              },
            extraCssText:
              "width:auto;height:28px;display:flex;aling-items:center;justify-content:center;border-radius:0px;",
            opacity: 1,
          },
    xAxis: [
      {
        type: xAxis.type,
        data: xAxis.data
      }
    ],
    yAxis: [
      {
        type: yAxis.type,
      },
    ],
    series: series.map( serie =>{
        return {
            name: serie.name,
            type: serie.type,
            data: serie.data,
            itemStyle: {
                color: serie.color
            }
        }})
  }
}