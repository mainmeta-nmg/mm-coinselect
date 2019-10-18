// baseline estimates, used to improve performance
var TX_EMPTY_SIZE = 4 + 1 + 1 + 4;
var TX_INPUT_BASE = 32 + 4 + 1 + 4;
var TX_INPUT_PUBKEYHASH = 107;
var TX_OUTPUT_BASE = 8 + 1;
var TX_OUTPUT_PUBKEYHASH = 25;
var TX_DUST_AMOUNT = 546;

function inputBytes(input) {
    return TX_INPUT_BASE + (input.script ? input.script.length : TX_INPUT_PUBKEYHASH);
}

function outputBytes(output) {
    return TX_OUTPUT_BASE + (output.script ? output.script.length : TX_OUTPUT_PUBKEYHASH);
}

function feeAmount(bytes, feeRate) {
  return Math.ceil(bytes * feeRate);
}

function dustThreshold(output, feeRate) {
    /* ... classify the output for input estimate  */
    // return inputBytes({}) * feeRate
    return TX_DUST_AMOUNT;
}

function transactionBytes(inputs, outputs) {
    return (
        TX_EMPTY_SIZE +
        inputs.reduce(function(a, x) {
            return a + inputBytes(x);
        }, 0) +
        outputs.reduce(function(a, x) {
            return a + outputBytes(x);
        }, 0)
    );
}

function uintOrNaN(v) {
    if (typeof v !== "number") return NaN;
    if (!isFinite(v)) return NaN;
    // if (Math.floor(v) !== v) return NaN;
    if (v < 0) return NaN;
    return v;
}

function sumForgiving(range) {
    return range.reduce(function(a, x) {
        return a + (isFinite(x.value) ? x.value : 0);
    }, 0);
}

function sumOrNaN(range) {
    return range.reduce(function(a, x) {
        return a + uintOrNaN(x.value);
    }, 0);
}

var BLANK_OUTPUT = outputBytes({});

function finalize(inputs, outputs, feeRate) {
    var bytesAccum = transactionBytes(inputs, outputs);
    var feeAfterExtraOutput = feeAmount((bytesAccum + BLANK_OUTPUT), feeRate);
    var remainderAfterExtraOutput = sumOrNaN(inputs) - (sumOrNaN(outputs) + feeAfterExtraOutput);

    // is it worth a change output?
    if (remainderAfterExtraOutput > dustThreshold({}, feeRate)) {
        outputs = outputs.concat({ value: remainderAfterExtraOutput });
    }

    var fee = sumOrNaN(inputs) - sumOrNaN(outputs);
    if (!isFinite(fee)) return { fee: feeAmount(bytesAccum, feeRate) };

    return {
        inputs: inputs,
        outputs: outputs,
        fee: fee
    };
}

module.exports = {
    feeAmount: feeAmount,
    dustThreshold: dustThreshold,
    finalize: finalize,
    inputBytes: inputBytes,
    outputBytes: outputBytes,
    sumOrNaN: sumOrNaN,
    sumForgiving: sumForgiving,
    transactionBytes: transactionBytes,
    uintOrNaN: uintOrNaN
};
