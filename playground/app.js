import React, { Component } from "react";
import { render } from "react-dom";
import Codemirror from "react-codemirror";
import "codemirror/mode/javascript/javascript";

import { shouldRender } from "../src/utils";
import Form from "../src";

// Import a few CodeMirror themes; these are used to match alternative
// bootstrap ones.
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/mbo.css";
import "codemirror/theme/ttcn.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/eclipse.css";

// Patching CodeMirror#componentWillReceiveProps so it's executed synchronously
// Ref https://github.com/mozilla-services/react-jsonschema-form/issues/174
Codemirror.prototype.componentWillReceiveProps = function(nextProps) {
  if (
    this.codeMirror &&
    nextProps.value !== undefined &&
    this.codeMirror.getValue() != nextProps.value
  ) {
    //this.codeMirror.setValue(nextProps.value);
  }
  if (typeof nextProps.options === "object") {
    for (var optionName in nextProps.options) {
      if (nextProps.options.hasOwnProperty(optionName)) {
        this.codeMirror.setOption(optionName, nextProps.options[optionName]);
      }
    }
  }
};

const log = type => console.log.bind(console, type);
const fromJson = json => typeof(json) === "string" ? JSON.parse(json) : json;
const toJson = val => JSON.stringify(val, null, 2);
const liveValidateSchema = { type: "boolean", title: "Live validation" };
const cmOptions = {
  theme: "default",
  height: "auto",
  viewportMargin: Infinity,
  mode: {
    name: "javascript",
    json: true,
    statementIndent: 2,
  },
  lineNumbers: true,
  lineWrapping: true,
  indentWithTabs: false,
  tabSize: 2,
};

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = { valid: true, code: props.code };
  }

  componentWillReceiveProps(props) {
    this.setState({ valid: true, code: props.code });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  onCodeChange = code => {
    this.setState({ valid: true, code });
    setImmediate(() => {
      try {
        this.props.onChange(fromJson(this.state.code));
      } catch (err) {
        this.setState({ valid: false, code });
      }
    });
  };

  render() {
    const { title, theme } = this.props;
    const icon = this.state.valid ? "ok" : "remove";
    const cls = this.state.valid ? "valid" : "invalid";
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <span className={`${cls} glyphicon glyphicon-${icon}`} />
          {" " + title}
        </div>
        <Codemirror
          value={this.state.code}
          onChange={this.onCodeChange}
          options={Object.assign({}, cmOptions, { theme })}
        />
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    // initialize state with Simple data sample
    const { schema, uiSchema, formData, validate } = window["data"];
    this.state = {
      form: false,
      schema: schema ? toJson(schema) : "{}",
      uiSchema: uiSchema ? toJson(uiSchema) : "{}",
      formData: formData ? toJson(formData) : "{}",
      validate,
      editor: "default",
      theme: "default",
      liveValidate: true,
      shareURL: null,
    };
  }

  doPost() {
    console.log(this);
    let name = document.getElementById('name').value;
    const {
      schema,
      uiSchema,
      formData,
    } = this.state;
    fetch(window["postEndPoint"] + '/' + name, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, schema, uiSchema, formData }),
    }).then ((response) => {
      if (response.status == 200) {
        let evt = new Event("ObjectSaved");
        document.dispatchEvent(evt);
      }
      else {
        let evt = new Event("ObjectSavedError");
        document.dispatchEvent(evt);
      }
    })
    .catch((err) => {
      let evt = new Event("ObjectSavedError");
      document.dispatchEvent(evt);
    });
  }
  componentDidMount() {

    this.load(window["data"]);

  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
    //return shouldRender(this, nextProps, nextState);
  }

  load = data => {
    // Reset the ArrayFieldTemplate whenever you load new data
    const { ArrayFieldTemplate } = data;
    // force resetting form component instance
    this.setState({ form: false }, _ =>
      this.setState({ ...data, form: true, ArrayFieldTemplate })
    );
  };

  onSchemaEdited = schema => this.setState({ schema, shareURL: null });

  onUISchemaEdited = uiSchema => this.setState({ uiSchema, shareURL: null });

  onFormDataEdited = formData => this.setState({ formData, shareURL: null });

  onThemeSelected = (theme, { stylesheet, editor }) => {
    this.setState({ theme, editor: editor ? editor : "default" });
    setImmediate(() => {
      // Side effect!
      document.getElementById("theme").setAttribute("href", stylesheet);
    });
  };

  setLiveValidate = ({ formData }) => this.setState({ liveValidate: formData });

  onFormDataChange = ({ formData }) =>
    this.setState({ formData, shareURL: null });

  onShare = () => {
    const { formData, schema, uiSchema } = this.state;
    const { location: { origin, pathname } } = document;
    try {
      const hash = btoa(JSON.stringify({ formData, schema, uiSchema }));
      this.setState({ shareURL: `${origin}${pathname}#${hash}` });
    } catch (err) {
      this.setState({ shareURL: null });
    }
  };

  render() {
    const {
      schema,
      uiSchema,
      formData,
      liveValidate,
      validate,
      editor,
      ArrayFieldTemplate,
      transformErrors,
    } = this.state;
    let doPost = this.doPost.bind(this);
    return (
      <div className="container-fluid">
        <div className="page-header">
          <div className="row">
            <div className="col-sm-2">
              <button
                className="btn btn-success savebtn"
                onClick={doPost}>
                Save
              </button>
              
            </div>
          </div>
        </div>
        <div className="row data">
          <div className="col-md-4">
            <Editor
              title="JSONSchema"
              theme={editor}
              code={schema}
              onChange={this.onSchemaEdited}
            />
          </div>
          <div className="col-md-4">
            <Editor
              title="UISchema"
              theme={editor}
              code={uiSchema}
              onChange={this.onUISchemaEdited}
            />
          </div>
          <div className="col-md-4">
            <Editor
              title="Sample form data"
              theme={editor}
              code={formData}
              onChange={this.onFormDataEdited}
            />
          </div>
        </div>

        <div className="row">
          
          <div className="col-md-12">
            {this.state.form &&
              <Form
                ArrayFieldTemplate={ArrayFieldTemplate}
                liveValidate={liveValidate}
                schema={fromJson(schema)}
                uiSchema={fromJson(uiSchema)}
                formData={fromJson(formData)}
                onChange={this.onFormDataChange}
                onSubmit={({ formData }) => {
                  console.log("submitted formData", formData);
                  doPost();
                }}
                fields={{}}
                validate={validate}
                onBlur={(id, value) =>
                  console.log(`Touched ${id} with value ${value}`)}
                transformErrors={transformErrors}
                onError={log("errors")}
              />}
          </div>
        </div>

      </div>
    );
  }
}

render(<App />, document.getElementById("app"));
