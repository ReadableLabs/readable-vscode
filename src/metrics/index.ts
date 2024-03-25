import axios from "axios";
import { v4 as uuid } from "uuid";

let spanList: Span[] = [];

// todo: implement auto sending whenever
// the span has been updated and more than x secs
// have passed. but later
export class Span {
  name: string;
  value: any;
  sent: boolean;
  constructor(name: string) {
    this.name = name;
    this.value = {};
    this.sent = false;
  }

  public report(obj: object) {
    this.value = { ...this.value, ...obj };
  }

  public valueOf(key: string) {
    return this.value[key];
  }

  // sending a span will delete it.
  public send() {
    try {
      console.log("sending");
      this.value = { ...this.value, spanName: this.name };
      // axios.post("http://localhost:8000/span", {
      //   span: this.value,
      // });
      this.sent = true;
      console.log(this.value);
    } catch (err) {
      console.log(err);
    }
  }

  toString() {
    return this.name;
  }
}

export function getSpan(name: string) {
  console.log(spanList);
  let item = spanList.find((e) => e.toString() === name);

  if (item) {
    return item;
  }

  let span = new Span(name);
  spanList.push(span);
  console.log(spanList);
  return span;
}

export function report(name: string) {}
