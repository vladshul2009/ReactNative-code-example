'use strict';
 
import ServerError from "./ServerError";
 
const ENDPOINT_DEV = ;
const ENDPOINT_PROD = ;
const endpoint = ENDPOINT_PROD;
 
const METHODS_NAMES = [];
const getMethodsResponses = () => {
    const methodsResponses = new Map();
    METHODS_NAMES.forEach(value => methodsResponses.set(value, `SOAP-ENV:${value}Response`));
    return methodsResponses;
};
const METHODS_RESPONSES = getMethodsResponses();
 
let now = Date.now();
 
class TestService {
}
 
class TestServiceUtils {
    static getResponse(apiMethodName = '', inputParams = [], inputParamsNames = []) {
        now = Date.now();
        console.log(`<---------------------------------------->`);
        console.log('request');
        console.log('<---------------------------------------->');
        console.log(`endpoint: ${endpoint}`);
 
        return TestServiceUtils.getFetch(TestServiceUtils.getParamsForFetch(apiMethodName, TestServiceUtils.getBody(apiMethodName, inputParams, inputParamsNames)))
            .then(response => {
                const responseText = response.text();
                console.log(`<---------------------------------------->`);
                console.log('response');
                console.log('<---------------------------------------->');
                console.log(`status: ${response.status}`);
                return responseText;
            })
            .then(body => new Promise(((resolve, reject) => {
                const startTimeForParsing = Date.now();
                const xml2js = require('react-native-xml2js');
                const parser = new xml2js.Parser({explicitArray: false});
                parser.parseString(body, (err, result) => {
                    console.log(`time for parsing: ${Date.now() - startTimeForParsing}`);
                    console.log(`time: ${Date.now() - now}`);
                    console.log(`text: ${body.replace(/></g, '>\n<')}`);
                    if (err !== null) {
                        reject(err);
                    } else if (body.indexOf('SOAP-ENV:Fault') !== -1) {
                        reject(new ServerError(
                            `Server error in API method ${apiMethodName}`,
                            result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['faultcode'],
                            result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']['faultstring']));
                    } else {
                        resolve(result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][METHODS_RESPONSES.get(apiMethodName)]['result']);
                    }
                });
            })));
    }
 
    static getFetch(params) {
        return fetch(endpoint, params);
    }
 
    static getParamsForFetch(apiMethodName = '', body = '') {
        const paramsForFetch = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `urn:gpguide#${apiMethodName}`
            },
            body: body
        };
        console.log(`method: ${paramsForFetch.method}`);
        console.log(`headers: Content-Type: ${paramsForFetch.headers['Content-Type']}\nSOAPAction: ${paramsForFetch.headers['SOAPAction']}`);
        console.log(`body: ${paramsForFetch.body.replace(/></g, '>\n<')}`);
 
        return paramsForFetch;
    }
 
    static getBody(apiMethodName = '', inputParams = [], inputParamsNames = []) {
        const cultureCode = 'en-GB';
        let inputParamsXml = '';
        switch (inputParams.length) {
            case 0:
                inputParamsXml = `<urn:${apiMethodName}/>`;
                break;
            case 1:
                inputParamsXml = `<urn:${apiMethodName}>
                                      <urn:${inputParamsNames[0]}>${inputParams[0]}</urn:${inputParamsNames[0]}>
                                  </urn:${apiMethodName}>`;
                break;
            case 2:
                inputParamsXml = `<urn:${apiMethodName}>
                                       <urn:${inputParamsNames[0]}>${inputParams[0]}</urn:${inputParamsNames[0]}>
                                       <urn:${inputParamsNames[1]}>${inputParams[1]}</urn:${inputParamsNames[1]}>
                                  </urn:${apiMethodName}>`;
                break;
        }
 
        return `<?xml version="1.0"?>
                  <x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:test">
                      <x:Header>
                          <urn:cultureCode>${cultureCode}</urn:cultureCode>
                      </x:Header>
                      <x:Body>
                          ${inputParamsXml}
                      </x:Body>
                  </x:Envelope>`
            .replace(/\s+/g, '')
            .replace(/\?xml/g, '?xml ')
            .replace(/xmlns/g, ' xmlns');
    }
 
    static getFuncArgumentsNames(func) {
        const stripComments = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg;
        const argumentNames = /([^\s,]+)/g;
 
        let funcStr = func.toString().replace(stripComments, '');
        let result = funcStr.slice(funcStr.indexOf('(') + 1, funcStr.indexOf(')')).match(argumentNames);
        if (result === null)
            result = [];
 
        return result;
    }
}
 
export default TestService;
