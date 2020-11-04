import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

import { Table, Button } from 'react-bootstrap';

class Reports extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        isLoading: false,
        isDataLoaded: false,
        hasError: false,
        error: null,
        report: {}
    }
    this.generateReport = this.generateReport.bind(this);
  }

  calculateReport(result = []) {
    const report = {};
    if (!Array.isArray(result)) return report;
    result.forEach(({ format, totalAttentionTime, totoalExecutedImpressions, totalTimeInView}) => {
      if (format && totalAttentionTime) {
        if (!report[format]) report[format] = { totalAttentionTime };
        else if (!report[format]['totalAttentionTime']) {
          report[format] = { ...report[format], totalAttentionTime }
        }
      }
      if (format && totoalExecutedImpressions) {
        if (!report[format]) report[format] = { totoalExecutedImpressions };
        else if (!report[format]['totoalExecutedImpressions']) {
          report[format] = { ...report[format], totoalExecutedImpressions }
        }
      }
      if (format && totalTimeInView) {
        if (!report[format]) report[format] = { totalTimeInView };
        else if (!report[format]['totalTimeInView']) {
          report[format] = { ...report[format], totalTimeInView }
        }
      }
    })
    // average attention time  = totalAttentionTime / totalExecutedTime
    // average time in view = totalTimeInView / totalExcutedTime
    Object.keys(report).forEach(key => {
      const format = report[key];
      const { totalAttentionTime, totoalExecutedImpressions, totalTimeInView } = format || {};
      if (totoalExecutedImpressions <= 0) {
        // -1 indicates errors in data
        format.averageAttentionTime = -1;
        format.averageTimeInView = -1;
      }  else {
        format.averageAttentionTime = totalAttentionTime / totoalExecutedImpressions;
        format.averageTimeInView = totalTimeInView / totoalExecutedImpressions;
      }
    })
    return report;
  }

  generateReport() {
    this.setState({
      isLoading: true
    }, () => {
      fetch('http://localhost:3000/report')
      .then(res => res.json())
      .then(
        result => {
          if (Array.isArray(result)) {
            const report = this.calculateReport(result);
            this.setState({
              isLoading: false,
              isDataLoaded: true,
              hasError: false,
              error: null,
              report
            })
          }
        },
        error => {
          console.error('generateReport error', error);
          this.setState({
            isLoading: false,
            isDataLoaded: false,
            hasError: true,
            error
          })
        }
      );
    })

  }

  render() {
    const { report } = this.state;
    return (
      <div className="container-fluid">
        <h1>Key metrics in the last 24 hours by format</h1>
            <Button
                type="button"
                className="btn btn-primary"
                id="run-btn"
                onClick={this.generateReport}
            >
                Generate report
            </Button>
            <Table striped bordered>
                <thead>
                    <tr>
                        <td>Format</td>
                        <td>Average Time In View</td>
                        <td>Average Attention Time</td>
                    </tr>
                    {Object.keys(report).map(format => {
                      const { averageTimeInView, averageAttentionTime } = report[format] || {};
                      return (
                        <tr key={format}>
                            <td>{format}</td>
                            <td>{averageTimeInView}</td>
                            <td>{averageAttentionTime}</td>
                        </tr>
                      )
                    })}
                </thead>
                <tbody>
                </tbody>
            </Table>
      </div>
    )
  }
}

let App = document.getElementById("app");

ReactDOM.render(<Reports />, App);
