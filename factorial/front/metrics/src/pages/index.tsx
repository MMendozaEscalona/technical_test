import { XAxis, YAxis, Serie, getOptionsToChart } from "@/utils/echartOptions";
import {
  ChangeEvent,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { useFetch } from "../hooks/useFetch";
import ReactEcharts from "echarts-for-react";
import { baseColors } from "@/styles/baseColors";

const DAYS = "Days";
const HOURS = "Hours";
const MINUTES = "Minutes";

interface Metric {
  average: number;
  time: string;
  value: string;
}

interface OptionsEchart {
  xAxis: XAxis;
  yAxis: YAxis;
  serie: Serie[];
}

export default function Home() {
  const { fetchCall } = useFetch();

  const [dayData, setDayData] = useState();
  const [hourData, setHourData] = useState();
  const [minuteData, setMinuteData] = useState();

  const [dayOptions, setDayOptions] = useState();
  const [hourOptions, setHourOptions] = useState();
  const [minuteOptions, setMinuteOptions] = useState();

  const postFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && event.target.files) {
      const formData = new FormData();
      formData.append("file", event.target.files[0]);

      fetchCall("http://0.0.0.0/metric", { body: formData }).then((result) => {
        if (result) {
          setDayData(result["data_day"]);
          setHourData(result["data_hour"]);
          setMinuteData(result["data_minute"]);
        }
      });
    }
  };

  const loadData = (
    data: { [kay: string]: Metric[] } | undefined,
    setOptions: Dispatch<SetStateAction<undefined>>,
    title: string
  ) => {
    if (data) {
      // Keys of set like CPU, RAM
      let keys = Object.keys(data);
      let options: OptionsEchart = {
        xAxis: {
          type: "category",
          data: [],
        },
        yAxis: {
          type: "value",
        },
        serie: [],
      };
      keys.map((key, index) => {
        let metrics: Metric[] = data[key];
        options.serie.push({
          name: key,
          type: "bar",
          data: [],
          color: baseColors[index].hex,
        });
        metrics.map((result: Metric) => {
          !options.xAxis.data.includes(result.time) &&
            options.xAxis.data.push(result.time);
          options.serie[index].data.push({
            value: parseInt(result.value),
            average: result.average,
          });
        });
      });
      setOptions(
        getOptionsToChart(
          options.xAxis,
          options.yAxis,
          options.serie,
          keys,
          title
        )
      );
    }
  };

  useEffect(() => {
    loadData(dayData, setDayOptions, DAYS);
    loadData(hourData, setHourOptions, HOURS);
    loadData(minuteData, setMinuteOptions, MINUTES);
  }, [dayData, hourData, minuteData]);

  return (
    <>
      <input type="file" onChange={postFile}></input>
      <div className="grid">
        {dayOptions && <ReactEcharts option={dayOptions} />}
        {hourOptions && <ReactEcharts option={hourOptions} />}
        {minuteOptions && <ReactEcharts option={minuteOptions} />}
      </div>
    </>
  );
}
