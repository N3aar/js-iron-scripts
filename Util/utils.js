const wait = (callback, ticks) => {
	const delay = Delay.interval(() => {
		Delay.cancel(delay)
		callback()
	}, ticks)

	return delay
}

const isModerator = (entity, rank) => entity.hasRank(rank)

const Command = (command, start, rank, callback) => {
	const execute = (entity, message) => {
		if (isModerator(entity, rank)) {
			const args = message.split(' ').slice(1)
			callback(entity, message, args)
		}
	}

	Commands.register(command, start, execute)
}

const createFakePlayer = (config) => {
	const bot = Faker.createFakePlayer(config.name, config.x, config.y, config.z, 0)

	if (config.r) {
		bot.teleport(config.x, config.y, config.z, config.r)
	}

	if (config.figure) {
		bot.setFigure(config.gender, config.figure)
	}

	if (config.motto) {
		bot.setMotto(config.motto)
	}

	if (config.dance) {
		bot.setDance(config.dance)
	}

	if (config.handitem) {
		bot.setHandItem(config.handitem)
	}

	if (config.effect) {
		bot.setEffect(config.effect)
	}

	return bot
}

const alphabet = {
	number: 7357, a: 7399, b: 7175,
	c: 7161, d: 7315, e: 7273, f: 7259,
	g: 7063, h: 7105, i: 7203, j: 7245,
	k: 7343, l: 7231, m: 7189, n: 7329,
	o: 7133, p: 7413, q: 7287, r: 7077,
	s: 7091, t: 7119, u: 7371, v: 7147,
	w: 7049, x: 7217, y: 7301, z: 7385
}

const objectValues = object => Object.keys(object).map(key => object[key])

const random = (max, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min

const nextInRotation = [
	data => ({ x: data.x, y: data.y - 1 }),
	data => ({ x: data.x + 1, y: data.y - 1 }),
	data => ({ x: data.x + 1, y: data.y }),
	data => ({ x: data.x + 1, y: data.y + 1 }),
	data => ({ x: data.x, y: data.y + 1 }),
	data => ({ x: data.x - 1, y: data.y + 1 }),
	data => ({ x: data.x - 1, y: data.y }),
	data => ({ x: data.x - 1, y: data.y - 1 })
]

const allRotations = data => [
	{ x: data.x, y: data.y - 1 },
	{ x: data.x + 1, y: data.y - 1 },
	{ x: data.x + 1, y: data.y },
	{ x: data.x + 1, y: data.y + 1 },
	{ x: data.x, y: data.y + 1 },
	{ x: data.x - 1, y: data.y + 1 },
	{ x: data.x - 1, y: data.y },
	{ x: data.x - 1, y: data.y - 1 }
]

const getRotation = entity => Engine.d(`Rotação: ${entity.getR()}`)

const ADSFurni = (furni, x = 0, y = 0, z = 0, iurl = '', curl = '') => ({
	x: x,
	y: y,
	z: z,
	iurl: iurl,
	curl: curl,
	furni: furni,

	setImageUrl (url) {
		this.iurl = url   
		this._refresh()
		return this
	},
	
	setClickUrl(url){
		this.curl = url   
		this._refresh()
		return this
	},

	setX (x) {
		this.x = x
		this._refresh()
		return this
	},
	
	setY (y) {
		this.y = y
		this._refresh()
		return this
	},
	
	setZ(z) {
		this.z = z    
		this._refresh()
		return this
	},
	
	_refresh(){
		this.furni.setState(`state	0	imageUrl	${this.iurl}	clickUrl	${this.curl}	offsetX	${this.x}	offsetY	${this.y}	offsetZ	${this.z}`)
	}
})

export {
	wait,
	createFakePlayer,
	objectValues,
	random,
	getRotation,
	allRotations,
	isModerator,
	Command,
	ADSFurni,
	nextInRotation,
	alphabet
}
