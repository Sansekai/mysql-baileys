import { randomBytes, generateKeyPairSync, randomUUID } from 'crypto'
import { KeyPair, valueReplacer, valueReviver, AuthenticationCreds, AppDataSync, Fingerprint, Bits } from '../Types'

const gf = (init: number[] | undefined = []) => {
	const r = new Float64Array(16)

	const arr = new Float64Array(init)

	for (let i = 0; i < arr.length; i++){
		r[i] = arr[i]
	}

	return r
}

const K = [1116352408,3609767458,1899447441,602891725,3049323471,3964484399,3921009573,2173295548,961987163,4081628472,1508970993,3053834265,2453635748,2937671579,2870763221,3664609560,3624381080,2734883394,310598401,1164996542,607225278,1323610764,1426881987,3590304994,1925078388,4068182383,2162078206,991336113,2614888103,633803317,3248222580,3479774868,3835390401,2666613458,4022224774,944711139,264347078,2341262773,604807628,2007800933,770255983,1495990901,1249150122,1856431235,1555081692,3175218132,1996064986,2198950837,2554220882,3999719339,2821834349,766784016,2952996808,2566594879,3210313671,3203337956,3336571891,1034457026,3584528711,2466948901,113926993,3758326383,338241895,168717936,666307205,1188179964,773529912,1546045734,1294757372,1522805485,1396182291,2643833823,1695183700,2343527390,1986661051,1014477480,2177026350,1206759142,2456956037,344077627,2730485921,1290863460,2820302411,3158454273,3259730800,3505952657,3345764771,106217008,3516065817,3606008344,3600352804,1432725776,4094571909,1467031594,275423344,851169720,430227734,3100823752,506948616,1363258195,659060556,3750685593,883997877,3785050280,958139571,3318307427,1322822218,3812723403,1537002063,2003034995,1747873779,3602036899,1955562222,1575990012,2024104815,1125592928,2227730452,2716904306,2361852424,442776044,2428436474,593698344,2756734187,3733110249,3204031479,2999351573,3329325298,3815920427,3391569614,3928383900,3515267271,566280711,3940187606,3454069534,4118630271,4000239992,116418474,1914138554,174292421,2731055270,289380356,3203993006,460393269,320620315,685471733,587496836,852142971,1086792851,1017036298,365543100,1126000580,2618297676,1288033470,3409855158,1501505948,4234509866,1607167915,987167468,1816402316,1246189591]

const D = gf([61785,9906,39828,60374,45398,33411,5274,224,53552,61171,33010,6542,64743,22239,55772,9222])
const X = gf([54554,36645,11616,51542,42930,38181,51040,26924,56412,64982,57905,49316,21502,52590,14035,8553])
const Y = gf([26200,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214,26214])

const L = new Float64Array([237,211,245,92,26,99,18,88,214,156,247,162,222,249,222,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16])

const set = (r: Float64Array, a: Float64Array) => {
	for (let i = 0; i < 16; i++){
		r[i] = a[i] | 0
	}
}

const multiplier = (o: Float64Array, a: Float64Array, b: Float64Array) => {
	const array = new Array(48).fill(0)

	for (let i = 0; i < 16; i++){
		array[i + 32] = b[i]
	}


	for (let l = 0; l < 16; l++){
		for (let i = 0; i < 16; i++){
			array[i + l] += a[l] * b[i]
		}
	}

	for (let i = 0; i < 15; i++){
		array[i] += 38 * array[i + 16]
	}


	for (let n = 0; n < 2; n++){
		let c = 1

		for (let i = 0; i < 16; i++){
			const v = array[i] + c + 65535
			array[i] = v - (c = Math.floor(v / 65536)) * 65536
		}

		array[0] = array[0] + (c - 1 + 37 * (c - 1))
	}

	for (let i = 0; i < 16; i++){
		o[i] = array[i]
	}
}

function sel(p: Float64Array, q: Float64Array, b: number) {
	let t: number
	const c = ~(b - 1)

	for (let i = 0; i < 16; i++) {
		t = c & (p[i] ^ q[i])
		p[i] ^= t
		q[i] ^= t
	}
}
	

function cswap(p: Float64Array[], q: Float64Array[], b: number) {
	for (let i = 0; i < 4; i++) {
		sel(p[i], q[i], b)
	}
}

function scalarmult(p: Float64Array[], q: Float64Array[], s: Uint8Array) {
	let b: number

	set(p[0], gf())
	set(p[1], gf([1]))
	set(p[2], gf([1]))
	set(p[3], gf())

	for (let i = 255; i >= 0; --i) {
		b = (s[(i / 8) | 0] >> (i & 7)) & 1

		cswap(p, q, b)

		add(q, p)
		add(p, p)

		cswap(p, q, b)
	}
}

function less(o: Float64Array, a: Float64Array, b: Float64Array) {
	for (let i = 0; i < 16; i++){
		o[i] = a[i] - b[i]
	}
}

function sum(o: Float64Array, a: Float64Array, b: Float64Array) {
	for (let i = 0; i < 16; i++){
		o[i] = a[i] + b[i]
	}
}

function add(p: Float64Array[], q: Float64Array[]) {
	const a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf()
	less(a, p[1], p[0])
	less(t, q[1], q[0])
	multiplier(a, a, t)
	sum(b, p[0], p[1])
	sum(t, q[0], q[1])
	multiplier(b, b, t)
	multiplier(c, p[3], q[3])
	multiplier(c, c, D)
	multiplier(d, p[2], q[2])
	sum(d, d, d)
	less(e, b, a)
	less(f, d, c)
	sum(g, d, c)
	sum(h, b, a)
	multiplier(p[0], e, f)
	multiplier(p[1], h, g)
	multiplier(p[2], g, f)
	multiplier(p[3], e, h)
}

const scalarbase = (p: Float64Array[], s: Uint8Array) => {
	const q = [gf(),gf(),gf(),gf()]
	set(q[0], X)
	set(q[1], Y)
	set(q[2], gf([1]))
	multiplier(q[3], X, Y)
	scalarmult(p, q, s)
}

function car(o: Float64Array) {
	let v: number
	let c: number = 1
	for (let i = 0; i < 16; i++) {
		v = o[i] + c + 65535
		c = Math.floor(v / 65536)
		o[i] = v - c * 65536
	}
	o[0] += c - 1 + 37 * (c - 1)
}

function otherPack(o: Uint8Array, n: Float64Array) {
	let b: number
	const m = gf(), t = gf()
	for (let i = 0; i < 16; i++)
		t[i] = n[i]

	car(t)
	car(t)
	car(t)

	for (let j = 0; j < 2; j++) {
		m[0] = t[0] - 0xffed
		for (let i = 1; i < 15; i++) {
			m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1)
			m[i - 1] &= 0xffff
		}
		m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1)
		b = (m[15] >> 16) & 1
		m[14] &= 0xffff
		sel(t, m, 1 - b)
	}
	for (let i = 0; i < 16; i++) {
		o[2 * i] = t[i] & 0xff
		o[2 * i + 1] = t[i] >> 8
	}
}

function par(a: Float64Array) {
	const d = new Uint8Array(32)
	otherPack(d, a)
	return d[0] & 1
}

function inv(o: Float64Array, i: Float64Array) {
	const c = gf()
	let a: number
	for (a = 0; a < 16; a++){
		c[a] = i[a]
	}
	for (a = 253; a >= 0; a--) {
		multiplier(c, c, c)
		if (a !== 2 && a !== 4){
			multiplier(c, c, i)
		}
	}
	for (a = 0; a < 16; a++)
		o[a] = c[a]
}

function pack(r: Uint8Array, p: Float64Array[]) {
	const tx = gf(), ty = gf(), zi = gf()
	inv(zi, p[2])
	multiplier(tx, p[0], zi)
	multiplier(ty, p[1], zi)
	otherPack(r, ty)
	r[31] ^= par(tx) << 7
}

const curve = (sm: Uint8Array, m: Uint8Array, n: number, sk: Uint8Array, opt_rnd: Uint8Array | undefined) => {
	const edsk = new Uint8Array(64)

	const p = [
		new Float64Array(16), new Float64Array(16),
		new Float64Array(16), new Float64Array(16)
	]

	for (let i = 0; i < 32; i++){
		edsk[i] = sk[i]
	}

	edsk[0] &= 248
	edsk[31] &= 127
	edsk[31] |= 64

	scalarbase(p, edsk)
	pack(edsk.subarray(32), p)

	const signBit = edsk[63] & 128

	const smlen = opt_rnd ? directRnd(sm, m, n, edsk, opt_rnd) : direct(sm, m, n, edsk)

	sm[63] |= signBit

	return smlen
}

function hashblocks(hh: Int32Array, hl: Int32Array, m: Uint8Array, n: number) {
	const wh = new Int32Array(16)
	const wl = new Int32Array(16)
	let bh0: number, bh1: number, bh2: number, bh3: number, bh4: number, bh5: number, bh6: number, bh7: number, bl0: number, bl1: number, bl2: number, bl3: number, bl4: number, bl5: number, bl6: number, bl7: number, th: number, tl: number, i: number, j: number, h: number, l: number, a: number, b: number, c: number, d: number
	let ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7]
	let pos = 0
	while (n >= 128) {
		for (i = 0; i < 16; i++) {
			j = 8 * i + pos
			wh[i] = (m[j + 0] << 24) | (m[j + 1] << 16) | (m[j + 2] << 8) | m[j + 3]
			wl[i] = (m[j + 4] << 24) | (m[j + 5] << 16) | (m[j + 6] << 8) | m[j + 7]
		}
		for (i = 0; i < 80; i++) {
			bh0 = ah0
			bh1 = ah1
			bh2 = ah2
			bh3 = ah3
			bh4 = ah4
			bh5 = ah5
			bh6 = ah6
			bh7 = ah7
			bl0 = al0
			bl1 = al1
			bl2 = al2
			bl3 = al3
			bl4 = al4
			bl5 = al5
			bl6 = al6
			bl7 = al7
			h = ah7
			l = al7
			a = l & 0xffff
			b = l >>> 16
			c = h & 0xffff
			d = h >>> 16
			h = ((ah4 >>> 14) | (al4 << (32 - 14))) ^ ((ah4 >>> 18) | (al4 << (32 - 18))) ^ ((al4 >>> (41 - 32)) | (ah4 << (32 - (41 - 32))))
			l = ((al4 >>> 14) | (ah4 << (32 - 14))) ^ ((al4 >>> 18) | (ah4 << (32 - 18))) ^ ((ah4 >>> (41 - 32)) | (al4 << (32 - (41 - 32))))
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			h = (ah4 & ah5) ^ (~ah4 & ah6)
			l = (al4 & al5) ^ (~al4 & al6)
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			h = K[i * 2]
			l = K[i * 2 + 1]
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			h = wh[i % 16]
			l = wl[i % 16]
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			b += a >>> 16
			c += b >>> 16
			d += c >>> 16
			th = (c & 0xffff) | (d << 16)
			tl = (a & 0xffff) | (b << 16)
			h = th
			l = tl
			a = l & 0xffff
			b = l >>> 16
			c = h & 0xffff
			d = h >>> 16
			h = ((ah0 >>> 28) | (al0 << (32 - 28))) ^ ((al0 >>> (34 - 32)) | (ah0 << (32 - (34 - 32)))) ^ ((al0 >>> (39 - 32)) | (ah0 << (32 - (39 - 32))))
			l = ((al0 >>> 28) | (ah0 << (32 - 28))) ^ ((ah0 >>> (34 - 32)) | (al0 << (32 - (34 - 32)))) ^ ((ah0 >>> (39 - 32)) | (al0 << (32 - (39 - 32))))
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			h = (ah0 & ah1) ^ (ah0 & ah2) ^ (ah1 & ah2)
			l = (al0 & al1) ^ (al0 & al2) ^ (al1 & al2)
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			b += a >>> 16
			c += b >>> 16
			d += c >>> 16
			bh7 = (c & 0xffff) | (d << 16)
			bl7 = (a & 0xffff) | (b << 16)
			h = bh3
			l = bl3
			a = l & 0xffff
			b = l >>> 16
			c = h & 0xffff
			d = h >>> 16
			h = th
			l = tl
			a += l & 0xffff
			b += l >>> 16
			c += h & 0xffff
			d += h >>> 16
			b += a >>> 16
			c += b >>> 16
			d += c >>> 16
			bh3 = (c & 0xffff) | (d << 16)
			bl3 = (a & 0xffff) | (b << 16)
			ah1 = bh0
			ah2 = bh1
			ah3 = bh2
			ah4 = bh3
			ah5 = bh4
			ah6 = bh5
			ah7 = bh6
			ah0 = bh7
			al1 = bl0
			al2 = bl1
			al3 = bl2
			al4 = bl3
			al5 = bl4
			al6 = bl5
			al7 = bl6
			al0 = bl7
			if (i % 16 === 15) {
				for (j = 0; j < 16; j++) {
					h = wh[j]
					l = wl[j]
					a = l & 0xffff
					b = l >>> 16
					c = h & 0xffff
					d = h >>> 16
					h = wh[(j + 9) % 16]
					l = wl[(j + 9) % 16]
					a += l & 0xffff
					b += l >>> 16
					c += h & 0xffff
					d += h >>> 16
					th = wh[(j + 1) % 16]
					tl = wl[(j + 1) % 16]
					h = ((th >>> 1) | (tl << (32 - 1))) ^ ((th >>> 8) | (tl << (32 - 8))) ^ (th >>> 7)
					l = ((tl >>> 1) | (th << (32 - 1))) ^ ((tl >>> 8) | (th << (32 - 8))) ^ ((tl >>> 7) | (th << (32 - 7)))
					a += l & 0xffff
					b += l >>> 16
					c += h & 0xffff
					d += h >>> 16
					th = wh[(j + 14) % 16]
					tl = wl[(j + 14) % 16]
					h = ((th >>> 19) | (tl << (32 - 19))) ^ ((tl >>> (61 - 32)) | (th << (32 - (61 - 32)))) ^ (th >>> 6)
					l = ((tl >>> 19) | (th << (32 - 19))) ^ ((th >>> (61 - 32)) | (tl << (32 - (61 - 32)))) ^ ((tl >>> 6) | (th << (32 - 6)))
					a += l & 0xffff
					b += l >>> 16
					c += h & 0xffff
					d += h >>> 16
					b += a >>> 16
					c += b >>> 16
					d += c >>> 16
					wh[j] = (c & 0xffff) | (d << 16)
					wl[j] = (a & 0xffff) | (b << 16)
				}
			}
		}
		h = ah0
		l = al0
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[0]
		l = hl[0]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[0] = ah0 = (c & 0xffff) | (d << 16)
		hl[0] = al0 = (a & 0xffff) | (b << 16)
		h = ah1
		l = al1
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[1]
		l = hl[1]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[1] = ah1 = (c & 0xffff) | (d << 16)
		hl[1] = al1 = (a & 0xffff) | (b << 16)
		h = ah2
		l = al2
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[2]
		l = hl[2]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[2] = ah2 = (c & 0xffff) | (d << 16)
		hl[2] = al2 = (a & 0xffff) | (b << 16)
		h = ah3
		l = al3
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[3]
		l = hl[3]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[3] = ah3 = (c & 0xffff) | (d << 16)
		hl[3] = al3 = (a & 0xffff) | (b << 16)
		h = ah4
		l = al4
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[4]
		l = hl[4]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[4] = ah4 = (c & 0xffff) | (d << 16)
		hl[4] = al4 = (a & 0xffff) | (b << 16)
		h = ah5
		l = al5
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[5]
		l = hl[5]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[5] = ah5 = (c & 0xffff) | (d << 16)
		hl[5] = al5 = (a & 0xffff) | (b << 16)
		h = ah6
		l = al6
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[6]
		l = hl[6]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[6] = ah6 = (c & 0xffff) | (d << 16)
		hl[6] = al6 = (a & 0xffff) | (b << 16)
		h = ah7
		l = al7
		a = l & 0xffff
		b = l >>> 16
		c = h & 0xffff
		d = h >>> 16
		h = hh[7]
		l = hl[7]
		a += l & 0xffff
		b += l >>> 16
		c += h & 0xffff
		d += h >>> 16
		b += a >>> 16
		c += b >>> 16
		d += c >>> 16
		hh[7] = ah7 = (c & 0xffff) | (d << 16)
		hl[7] = al7 = (a & 0xffff) | (b << 16)
		pos += 128
		n -= 128
	}
	return n
}

function ts64(x: Uint8Array, i: number, h: number, l: number) {
	x[i] = (h >> 24) & 0xff
	x[i + 1] = (h >> 16) & 0xff
	x[i + 2] = (h >> 8) & 0xff
	x[i + 3] = h & 0xff
	x[i + 4] = (l >> 24) & 0xff
	x[i + 5] = (l >> 16) & 0xff
	x[i + 6] = (l >> 8) & 0xff
	x[i + 7] = l & 0xff
}

function hash(out: Uint8Array, m: Uint8Array, n: number) {
	const hh = new Int32Array(8)
	const hl = new Int32Array(8)
	const x = new Uint8Array(256)
	const b = n
	hh[0] = 0x6a09e667
	hh[1] = 0xbb67ae85
	hh[2] = 0x3c6ef372
	hh[3] = 0xa54ff53a
	hh[4] = 0x510e527f
	hh[5] = 0x9b05688c
	hh[6] = 0x1f83d9ab
	hh[7] = 0x5be0cd19
	hl[0] = 0xf3bcc908
	hl[1] = 0x84caa73b
	hl[2] = 0xfe94f82b
	hl[3] = 0x5f1d36f1
	hl[4] = 0xade682d1
	hl[5] = 0x2b3e6c1f
	hl[6] = 0xfb41bd6b
	hl[7] = 0x137e2179
	hashblocks(hh, hl, m, n)
	n %= 128
	for (let i = 0; i < n; i++){
		x[i] = m[b - n + i]
	}
	x[n] = 128
	n = 256 - 128 * (n < 112 ? 1 : 0)
	x[n - 9] = 0
	ts64(x, n - 8, (b / 0x20000000) | 0, b << 3)
	hashblocks(hh, hl, x, n)
	for (let i = 0; i < 8; i++){
		ts64(out, 8 * i, hh[i], hl[i])
	}
}

function direct(sm: Uint8Array, m: Uint8Array, n: number, sk: Uint8Array) {
	const h = new Uint8Array(64)
	const r = new Uint8Array(64)
	const x = new Float64Array(64)
	const p = [gf(), gf(), gf(), gf()]
	for (let i = 0; i < n; i++){
		sm[64 + i] = m[i]
	}
	for (let i = 0; i < 32; i++){
		sm[32 + i] = sk[i]
	}
	hash(r, sm.subarray(32), n + 32)
	reduce(r)
	scalarbase(p, r)
	pack(sm, p)
	for (let i = 0; i < 32; i++){
		sm[i + 32] = sk[32 + i]
	}
	hash(h, sm, n + 64)
	reduce(h)
	for (let i = 0; i < 64; i++){
		x[i] = 0
	}
	for (let i = 0; i < 32; i++){
		x[i] = r[i]
	}
	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 32; j++) {
			x[i + j] += h[i] * sk[j]
		}
	}
	modL(sm.subarray(32), x)
	return n + 64
}

function directRnd(sm: Uint8Array, m: Uint8Array, n: number, sk: Uint8Array, rnd: Uint8Array) {
	const h = new Uint8Array(64)
	const r = new Uint8Array(64)
	const x = new Float64Array(64)
	const p = [gf(), gf(), gf(), gf()]
	sm[0] = 0xfe
	for (let i = 1; i < 32; i++){
		sm[i] = 0xff
	}
	for (let i = 0; i < 32; i++){
		sm[32 + i] = sk[i]
	}
	for (let i = 0; i < n; i++){
		sm[64 + i] = m[i]
	}
	for (let i = 0; i < 64; i++){
		sm[n + 64 + i] = rnd[i]
	}
	hash(r, sm, n + 128)
	reduce(r)
	scalarbase(p, r)
	pack(sm, p)
	for (let i = 0; i < 32; i++){
		sm[i + 32] = sk[32 + i]
	}
	hash(h, sm, n + 64)
	reduce(h)
	for (let i = 0; i < 64; i++){
		sm[n + 64 + i] = 0
	}
	for (let i = 0; i < 64; i++){
		x[i] = 0
	}
	for (let i = 0; i < 32; i++){
		x[i] = r[i]
	}
	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 32; j++) {
			x[i + j] += h[i] * sk[j]
		}
	}
	modL(sm.subarray(32, n + 64), x)
	return n + 64
}

function modL(r: Uint8Array, x: Float64Array | number[]) {
	let carry: number, j: number, k: number
	for (let i = 63; i >= 32; --i) {
		carry = 0
		for (j = i - 32, k = i - 12; j < k; ++j) {
			x[j] += carry - 16 * x[i] * L[j - (i - 32)]
			carry = (x[j] + 128) >> 8
			x[j] -= carry * 256
		}
		x[j] += carry
		x[i] = 0
	}
	carry = 0
	for (j = 0; j < 32; j++) {
		x[j] += carry - (x[31] >> 4) * L[j]
		carry = x[j] >> 8
		x[j] &= 255
	}
	for (j = 0; j < 32; j++){
		x[j] -= carry * L[j]
	}
	for (let i = 0; i < 32; i++) {
		x[i + 1] += x[i] >> 8
		r[i] = x[i] & 255
	}
}

function reduce(r: Uint8Array) {
	const x = new Float64Array(64)
	for (let i = 0; i < 64; i++){
		x[i] = r[i]
	}
	for (let i = 0; i < 64; i++){
		r[i] = 0
	}
	modL(r, x)
}

const sign = (secretKey: Uint8Array, msg: Uint8Array, opt_random: Uint8Array | undefined) => {
	if (secretKey.length !== 32){
		throw new Error('wrong secret key length')
	}

	if (opt_random && opt_random?.length !== 64){
		throw new Error('wrong random data length')
	}

	const buf = new Uint8Array((opt_random ? 128 : 64) + msg.length)

	curve(buf, msg, msg.length, secretKey, opt_random)

	const signature = new Uint8Array(64)

	for (let i = 0; i < signature.length; i++){
		signature[i] = buf[i]
	}
	
	return signature
}

const generateKeyPair = (): KeyPair => {
	const PUBLIC_KEY_DER_PREFIX = Buffer.from([ 48, 42, 48, 5, 6, 3, 43, 101, 110, 3, 33, 0 ])
	const PRIVATE_KEY_DER_PREFIX = Buffer.from([ 48, 46, 2, 1, 0, 48, 5, 6, 3, 43, 101, 110, 4, 34, 4, 32 ])

	const { publicKey, privateKey } = generateKeyPairSync('x25519', {
		publicKeyEncoding: {
			format: 'der',
			type: 'spki'
		},
		privateKeyEncoding: {
			format: 'der',
			type: 'pkcs8'
		}
	})

	const pubKey = publicKey.subarray(PUBLIC_KEY_DER_PREFIX.length - 1, PUBLIC_KEY_DER_PREFIX.length + 32)
	const privKey = privateKey.subarray(PRIVATE_KEY_DER_PREFIX.length, PRIVATE_KEY_DER_PREFIX.length + 32)

	return {
		private: privKey,
		public: pubKey.subarray(1)
	}
}

const generateSignalPubKey = (pubKey: Uint8Array) => {
	return pubKey.length === 33 ? pubKey : Buffer.concat([Buffer.from([5]), pubKey])
}

const validatePrivKey = (privKey: Uint8Array) => {
	if (privKey === undefined) {
		throw new Error("Undefined private key")
	}

	if (!(privKey instanceof Buffer)) {
		throw new Error(`Invalid private key type: ${privKey.constructor.name}`)
	}

	if (privKey.byteLength != 32) {
		throw new Error(`Incorrect private key length: ${privKey.byteLength}`)
	}
}

const calculateSignature = function(privKey: Uint8Array, message: any) {
	validatePrivKey(privKey)

	if (!message) {
		throw new Error("Invalid message")
	}

	return Buffer.from(sign(privKey, message, undefined))
}

const signedKeyPair = (identityKeyPair: KeyPair, keyId: number) => {
	const keyPair = generateKeyPair()
	const pubKey = generateSignalPubKey(keyPair.public)
	const signature = calculateSignature(identityKeyPair.private, pubKey)
	return { keyPair, signature, keyId }
}

const allocate = (str: string) => {
	let p = str.length

	if (!p){
		return new Uint8Array(1)
	}

	let n = 0

	while (--p % 4 > 1 && str.charAt(p) === "="){
		++n
	}

	return new Uint8Array(Math.ceil(str.length * 3) / 4 - n).fill(0)
}

const parseTimestamp = (timestamp: Bits | number) => {
	if (typeof timestamp === 'string') {
		return parseInt(timestamp, 10)
	}

	if (typeof timestamp === "number") {
		return timestamp
	}

	return {
		low: 0,
		high: 0,
		unsigned: false
	}
}

export const fromObject = (args: AppDataSync) => {
	if (typeof args?.fingerprint !== "object" || !args.keyData) {
		throw TypeError("args expected")
	}

	const f: Fingerprint = {
		...args.fingerprint,
		deviceIndexes: Array.isArray(args.fingerprint.deviceIndexes) ? args.fingerprint.deviceIndexes : []
	}

	const message = {
		keyData: Array.isArray(args.keyData) ? args.keyData : new Uint8Array(),
		fingerprint: {
			rawId: f.rawId >>> 0,
			currentIndex: f.rawId >>> 0,
			deviceIndexes: f.deviceIndexes.map(i => i >>> 0)
		},
		timestamp: parseTimestamp(args.timestamp)
	}

	if (typeof args.keyData === "string") {
		message.keyData = allocate(args.keyData)
	}

	return message
}

export const BufferJSON = {
	replacer: (_: string, value: valueReplacer) => {
		if(value?.type === 'Buffer' && Array.isArray(value?.data)) {
			return {
				type: 'Buffer',
				data: Buffer.from(value.data).toString('base64')
			}
		}
		return value
	},
	reviver: (_: string, value: valueReviver) => {
		if(value?.type === 'Buffer') {
			return Buffer.from(value?.data, 'base64')
		}
		return value
	}
}

export const initAuthCreds = (): AuthenticationCreds => {
	const identityKey = generateKeyPair()
	return {
		noiseKey: generateKeyPair(),
		pairingEphemeralKeyPair: generateKeyPair(),
		signedIdentityKey: identityKey,
		signedPreKey: signedKeyPair(identityKey, 1),
		registrationId: Uint16Array.from(randomBytes(2))[0] & 16383,
		advSecretKey: randomBytes(32).toString('base64'),
		processedHistoryMessages: [],
		nextPreKeyId: 1,
		firstUnuploadedPreKeyId: 1,
		accountSyncCounter: 0,
		accountSettings: {
			unarchiveChats: false
		},
		deviceId: Buffer.from(randomUUID().replace(/-/g, ''), 'hex').toString('base64url'),
		phoneId: randomUUID(),
		identityId: randomBytes(20),
		backupToken: randomBytes(20),
		registered: false,
		registration: {} as never,
		pairingCode: undefined,
		lastPropHash: undefined,
		routingInfo: undefined
	}
}
