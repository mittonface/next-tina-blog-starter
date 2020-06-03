import { parseISO, format, parse } from "date-fns";

export default function DateFormater({ dateString }) {
  let date;
  if (typeof dateString === "string") {
    date = parse(dateString, "yyyy-LL-dd", new Date());
  } else {
    date = dateString;
  }
  return <time dateTime={dateString}>{format(date, "LLLL	d, yyyy")}</time>;
}
