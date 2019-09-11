
function generate(n: number) {
    return function* () {
        for (let i = 0; i < n; ++i) {
            yield i;
        }
    };
}

function range(start: number, end: number) {
    return function*() {
        for (let i = start; i <= end; ++i) {
            yield i;
        }
    }
}

function rangeC(start: string, end: string) {
    return function*() {
        for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); ++i) {
            yield String.fromCharCode(i);
        }
    }
}



function combine<A,B>(
    gen1: () => IterableIterator<A|A[]>, gen2: () => IterableIterator<B|B[]>
)
: () => IterableIterator<(A|B)[]>
{
    return function*() {
        for(let a of gen1()) {
            for(let b of gen2()) {
                yield [a, b].flat();
            }
        }
    }
}

function concat<A,B>(gen1: ()=>IterableIterator<A>, gen2: ()=>IterableIterator<B>): ()=>IterableIterator<A|B> {
    return function* () {
        yield* gen1();
        yield* gen2();
    }
}

function xxa<T>(f: () => IterableIterator<T>): () => IterableIterator<T[]> {
    return function*() {
        for (let t of f()) {
            yield [ t ];
        }
    }
}

let az = concat(rangeC('a','z'), rangeC('0', '9'));

let levels = [az, az, az, az].map(xxa);

import * as dns from 'dns';

//resolve('cpxr.de', () => { console.log('cpxr.de done')});

const parallel = 50;


const l2 = levels.slice(0,2).reduce(combine);
const l3 = levels.slice(0,3).reduce(combine);
const l4 = levels.slice(0,4).reduce(combine);

console.log('l2: ', [...l2()].length);
console.log('l3: ', [...l3()].length);
//console.log('l4: ', [...l4()].length);

const gen = concat(l2, l3)()

for (let i = 0; i < parallel; ++i) {
    resolveNext(gen);
}

function resolveNext(gen: IterableIterator<string[]>) {
    let next = gen.next();
    if (!next.done) {
        resolve([next.value, '.de'].flat().join(''), () => {
            resolveNext(gen);
        });
    }
}


function resolve(x: string, doneCB?: () => void) {
    dns.resolve(x, 'ANY', printResolution);
    function printResolution(err: NodeJS.ErrnoException, addresses: dns.AnyRecord[]) {
        if (err) {
            console.log(`${x}: -- not found --`, err.code, err.errno);
        } else {
            console.log(`${x}: success`, summarizeRecords(addresses));
        }
        doneCB && doneCB();
    }
}

function summarizeRecords(addresses: any[]) {
    let summary = addresses.reduce((r,a) => {
        if (a.type) {
            if (!r.types.includes(a.type)) {
                r.types.push(a.type);
            }
            if (a.type === 'A') {
                r.ips.push(JSON.stringify(a));
            }
        }
        if (typeof a === 'string') {
            r.ips.push(a);
            if (!r.types.includes('A')) {
                r.types.push('A');
            }
        }
        return r;
    }, { ips: [], types: [] });

    return `${summary.types.join()} / ${summary.ips.join()} / `
}


/*
for(let i of combine(range(3,5), combine(generate(2), generate(2)))()) {
    console.log(i);
}
*/


/*
for(let i of combine(generate(3), combine(generate(3), generate(2)))()) {
    console.log(i);
}
*/
