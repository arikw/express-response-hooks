const
  chai = require('chai'),
  expect = chai.expect,
  responseHooks = require('../src/index.js');

describe('hooks activation middleware setup', () => {

  const
    EventEmitter = require('events'),
    responseHooksMW = responseHooks(),
    req = {},
    res = mockResponseObject();

  it('plugs the hooks event emitter to res.hooks', () => {
    responseHooksMW(req, res, (error) => {
      expect(error).to.be.undefined;
      expect(res.hooks).to.be.instanceof(EventEmitter);
    });
  });

  it('adds an object to bypass wrappers', () => {
    expect(res.hooks.bypass)
      .to.be.an('object')
      .and.to.have.all.keys('set', 'send');
  });

  describe('with custom options', () => {

    const EventEmitter = require('events');

    it('plugs the hooks event emitter to a custom property', () => {

      const
        responseHooksMW = responseHooks({
          plugName: 'myCustomProp'
        }),
        req = {},
        res = mockResponseObject();

      responseHooksMW(req, res, (error) => {
        expect(error).to.be.undefined;
        expect(res.myCustomProp).to.be.instanceof(EventEmitter);
      });
    });

  });

});


describe('hooks usage', () => {

  describe('statusCode hook', () => {

    const req = {};
    let responseHooksMW, res;

    beforeEach(() => {
      responseHooksMW = responseHooks(),
      res = mockResponseObject();
    });

    it('called when res.statusCode changed', () => {
      responseHooksMW(req, res, () => {
        let numOfCalls = 0;
        res.hooks.on('statusCode', ([ statusCode ]) => {
          expect(statusCode).to.equal(123 + numOfCalls);
          ++numOfCalls;
        });
        res.statusCode = 123;
        res.statusCode = 124;
        res.statusCode = 125;
        expect(numOfCalls).to.be.equal(3);
      });
    });

    it('hook can manipulate the statusCode', () => {
      responseHooksMW(req, res, () => {
        res.hooks.on('statusCode', (args) => {
          args[0] = 222;
        });
        res.statusCode = 111;
        expect(res.statusCode).to.equal(222);
      });
    });
  });

  describe('set() hook', () => {

    const req = {};
    let responseHooksMW, res;

    beforeEach(() => {
      responseHooksMW = responseHooks(),
      res = mockResponseObject();
    });

    it('triggered by res.set()', () => {
      responseHooksMW(req, res, () => {
        let numOfCalls = 0;
        res.hooks.on('set', ([ name, value ]) => {
          ++numOfCalls;
          expect(name).to.equal('custom-header' + numOfCalls);
          expect(value).to.equal('a-value' + numOfCalls);
        });
        res.set('custom-header1', 'a-value1');
        res.set('custom-header2', 'a-value2');
        res.set('custom-header3', 'a-value3');
        expect(numOfCalls).to.be.equal(3);
      });
    });

    it('not triggered by res.hooks.bypass.set()', () => {
      responseHooksMW(req, res, () => {
        let wasTriggered = false;
        res.hooks.on('set', () => {
          wasTriggered = true;
        });
        res.hooks.bypass.set('custom-header1', 'a-value1');
        expect(wasTriggered).to.be.false;
      });
    });

    it('hook can manipulate the header', () => {
      responseHooksMW(req, res, () => {
        res.hooks.on('set', (args) => {
          args[0] = 'new-header2';
          args[1] = 'new-value2';
        });
        res.set('custom-header2', 'a-value2');
        const headers = res.getHeaders();
        expect(headers['custom-header2']).to.not.exist;
        expect(headers['new-header2']).to.equal('new-value2');
      });
    });
  });

});

describe('send() hook', () => {

  const req = {};
  let responseHooksMW, res;

  beforeEach(() => {
    responseHooksMW = responseHooks(),
    res = mockResponseObject();
  });

  it('triggered by res.send()', () => {
    responseHooksMW(req, res, () => {
      let numOfCalls = 0;
      res.hooks.on('send', ([ body ]) => {
        ++numOfCalls;
        expect(JSON.stringify(body)).to.equal(JSON.stringify({ [`foo${numOfCalls}`]: `bar${numOfCalls}` }));
      });
      res.send({ foo1: 'bar1' });
      res.send({ foo2: 'bar2' });
      res.send({ foo3: 'bar3' });
      expect(numOfCalls).to.be.equal(3);
    });
  });

  it('not triggered by res.hooks.bypass.send()', () => {
    responseHooksMW(req, res, () => {
      let wasTriggered = false;
      res.hooks.on('send', () => {
        wasTriggered = true;
      });
      res.hooks.bypass.send({ foo: 'bar' });
      expect(wasTriggered).to.be.false;
    });
  });

  it('hook can manipulate the response body', () => {
    responseHooksMW(req, res, () => {
      res.hooks.on('send', (args) => {
        args[0] = 'new-body';
      });
      res.send('a-string');
      expect(res.getBody()).to.to.equal('new-body');
    });
  });
});

function mockResponseObject() {
  const headers = {};
  let body;
  return {
    statusCode: 200,
    send(data) { body = data; },
    set(name, value) { headers[name] = value; },
    getHeaders() { return headers; },
    getBody() { return body; }
  };
}
