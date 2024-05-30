import { Connection } from 'mysql2/promise'

type Awaitable<T> = T | Promise<T>

type Contact = {
	id: string
	lid?: string
	name?: string
	notify?: string
	verifiedName?: string
	imgUrl?: string | null
	status?: string
}

type Account = {
	details?: Uint8Array | null
	accountSignatureKey?: Uint8Array | null
	accountSignature?: Uint8Array | null
	deviceSignature?: Uint8Array | null
}

type SignedKeyPair = {
	keyPair: KeyPair
	signature: Uint8Array
	keyId: number
	timestampS?: number
}

type ProtocolAddress = {
	name: string
	deviceId: number
}

type SignalIdentity = {
	identifier: ProtocolAddress
	identifierKey: Uint8Array
}

type LTHashState = {
	version: number
	hash: Buffer
	indexValueMap: {
		[indexMacBase64: string]: { valueMac: Uint8Array | Buffer }
	}
}

type SignalCreds = {
	readonly signedIdentityKey: KeyPair
	readonly signedPreKey: SignedKeyPair
	readonly registrationId: number
}

type AccountSettings = {
	unarchiveChats: boolean
	defaultDisappearingMode?: Pick<any, 'ephemeralExpiration' | 'ephemeralSettingTimestamp'>
}

type SignalKeyStore = {
	get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Awaitable<{ [id: string]: SignalDataTypeMap[T] }>
	set(data: SignalDataSet): Awaitable<void>
}

interface RegistrationOptions {
	phoneNumber?: string
	phoneNumberCountryCode: string
	phoneNumberNationalNumber: string
	phoneNumberMobileCountryCode: string
	phoneNumberMobileNetworkCode: string
	method?: 'sms' | 'voice' | 'captcha'
	captcha?: string
}

export interface Long {
    high: number
    low: number
    unsigned: boolean
    add( addend: number | Long | string ): Long
    and( other: Long | number | string ): Long
    compare( other: Long | number | string ): number
    comp( other: Long | number | string ): number
    divide( divisor: Long | number | string ): Long
    div( divisor: Long | number | string ): Long
    equals( other: Long | number | string ): boolean
    eq( other: Long | number | string ): boolean
    getHighBits(): number
    getHighBitsUnsigned(): number
    getLowBits(): number
    getLowBitsUnsigned(): number
    getNumBitsAbs(): number
    greaterThan( other: Long | number | string ): boolean
    gt( other: Long | number | string ): boolean
    greaterThanOrEqual( other: Long | number | string ): boolean
    gte( other: Long | number | string ): boolean
    isEven(): boolean
    isNegative(): boolean
    isOdd(): boolean
    isPositive(): boolean
    isZero(): boolean
    lessThan( other: Long | number | string ): boolean
    lt( other: Long | number | string ): boolean
    lessThanOrEqual( other: Long | number | string ): boolean
    lte( other: Long | number | string ): boolean
    modulo( other: Long | number | string ): Long
    mod( other: Long | number | string ): Long
    multiply( multiplier: Long | number | string ): Long
    mul( multiplier: Long | number | string ): Long
    negate(): Long
    neg(): Long
    not(): Long
    notEquals( other: Long | number | string ): boolean
    neq( other: Long | number | string ): boolean
    or( other: Long | number | string ): Long
    shiftLeft( numBits: number | Long ): Long
    shl( numBits: number | Long ): Long
    shiftRight( numBits: number | Long ): Long
    shr( numBits: number | Long ): Long
    shiftRightUnsigned( numBits: number | Long ): Long
    shru( numBits: number | Long ): Long
    subtract( subtrahend: number | Long | string ): Long
    sub( subtrahend: number | Long |string ): Long
    toInt(): number
    toNumber(): number
    toBytes( le?: boolean ): number[]
    toBytesLE(): number[]
    toBytesBE(): number[]
    toSigned(): Long
    toString( radix?: number ): string
    toUnsigned(): Long
    xor( other: Long | number | string ): Long
}

export type SslOptions = {
	pfx?: string
	key?: string | string[] | Buffer | Buffer[]
	passphrase?: string
	cert?: string | string[] | Buffer | Buffer[]
	ca?: string | string[] | Buffer | Buffer[]
	crl?: string | string[]
	ciphers?: string
	rejectUnauthorized?: boolean
	minVersion?: string
	maxVersion?: string
	verifyIdentity?: boolean
}

export type Fingerprint = {
	rawId: number
	currentIndex: number
	deviceIndexes: number[]
}

export type Bits = {
	low: number
	high: number
	unsigned: boolean
}

export type AppDataSync = {
    keyData: Uint8Array
    fingerprint: Fingerprint
    timestamp: Long | number
}

export type SignalDataTypeMap = {
    session: Uint8Array
    'pre-key': KeyPair
    'sender-key': Uint8Array
    'app-state-sync-key': AppDataSync
    'app-state-sync-version': LTHashState
    'sender-key-memory': {
		[jid: string]: boolean
	}
}

export type SignalDataSet = {
	[T in keyof SignalDataTypeMap]?: {
		[id: string]: SignalDataTypeMap[T] | null
	}
}

export type KeyPair = {
	public: Uint8Array
	private: Uint8Array
}

export type sqlData = {
	constructor: {
		name: 'RowDataPacket'
	}
	value?: object[]
}

export interface sqlConnection extends Connection {
	connection?: {
		_closing?: boolean
	}
}

export type MySQLConfig = {
	session: string
	host?: string
	port?: number
	user?: string
	password: string
	database: string
	tableName?: string
	retryRequestDelayMs?: number
	maxtRetries?: number
	ssl?: string | SslOptions
}

export type valueReplacer = {
	data: number[]
	type: string
}

export type valueReviver = {
	data: string
	type: string
}

export type AuthenticationState = {
	creds: AuthenticationCreds
	keys: SignalKeyStore
}

export type AuthenticationCreds = SignalCreds & {
	readonly noiseKey: KeyPair
	readonly pairingEphemeralKeyPair: KeyPair
	advSecretKey: string
	me?: Contact
	account?: Account
	signalIdentities?: SignalIdentity[]
	myAppStateKeyId?: string
	firstUnuploadedPreKeyId: number
	nextPreKeyId: number
	lastAccountSyncTimestamp?: number
	platform?: string
	processedHistoryMessages: Pick<any, 'key' | 'messageTimestamp'>[]
	accountSyncCounter: number
	accountSettings: AccountSettings
	deviceId: string
	phoneId: string
	identityId: Buffer
	registered: boolean
	backupToken: Buffer
	registration: RegistrationOptions
	pairingCode: string | undefined
	lastPropHash: string | undefined
	routingInfo: Buffer | undefined
}
