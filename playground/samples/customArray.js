import React from "react";

function ArrayFieldTemplate(props) {
  var draggedElement;
  return (
    <div className={props.className}>
      {props.items &&

        props.items.map(element => (
          <div
            key={element.index}
            draggable={true}
            onDragStart={function(e) {
              draggedElement = e.currentTarget;
              e.dataTransfer.setData(
                "text/plain",
                JSON.stringify({ idx: element.index })
              );
            }}
            onDragOver={function(e) {
              e.preventDefault();

              // Logic here
            }}
            onDrop={function(e) {
              e.preventDefault();
              let data = e.dataTransfer.getData("text/plain");
              let fromIdx = JSON.parse(data).idx;
              let toIdx = element.index;
              if (
                draggedElement &&
                e.currentTarget.parentNode == draggedElement.parentNode
              ) {
                element.reorder(fromIdx, toIdx);
              }
            }}>
            <div>{element.children}</div>

            {element.hasMoveDown &&
              <button
                onClick={element.onReorderClick(
                  element.index,
                  element.index + 1
                )}>
                Down
              </button>}
            {element.hasMoveUp &&
              <button
                onClick={element.onReorderClick(
                  element.index,
                  element.index - 1
                )}>
                Up
              </button>}
            <button onClick={element.onDropIndexClick(element.index)}>
              Delete
            </button>
            <hr />
          </div>
        )}

      {props.canAdd &&
        <div className="row">
          <p className="col-xs-3 col-xs-offset-9 array-item-add text-right">
            <button onClick={props.onAddClick} type="button">
              Custom +
            </button>
          </p>
        </div>}
    </div>
  );
}

module.exports = {
  schema: {
    type: "object",
    title: "Custom array of strings",
    properties: {
      listOfStrings: {
        type: "array",
        items: {
          type: "string",
        },
      },
      anotherListOfStrings: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
  formData: {
    listOfStrings: ["jsonschema", "form", "react"],
    anotherListOfStrings: ["ok", "ok2"],
  },
  ArrayFieldTemplate,
};
