import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import csonContent from './index.cson';
import './index.css';

const component = <div>{_.camelCase("hello-world")}</div>;
ReactDOM.render(component, document.getElementById("root"));
console.log(csonContent);