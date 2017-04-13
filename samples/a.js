import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';


const component = <div>{_.camelCase("hello-world")}</div>;
ReactDOM.render(component, document.getElementById("root"));