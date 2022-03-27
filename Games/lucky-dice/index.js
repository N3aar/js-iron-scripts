import { wait, createFakePlayer } from '../../util/utils'

// Game Customzation
const config = {
	initX: 29,
	initY: 26,
	maxX: 43,
	maxY: 8,
	size: 60,
	effect: 96,
	narrator: {
		name: 'Guia',
		x: 13,
		y: 16,
		z: 0,
		r: 2,
		bubble: 3,
		motto: '',
		gender: 'm',
		figure: 'lg-275-1193.ch-990000603-1257-92.hd-180-1026.sh-3089-1257.ca-1807-1281.ha-990000056-1257.hr-3163-61.fa-201407-1365'
	},
	bot: {
		name: 'bot',
		x: 3,
		y: 37,
		z: 0,
		effect: 108
	},
	sounds: {
		positive: Room.getFurniById(300812119),
		negative: Room.getFurniById(300815333)
	},
	cooldown: {
		time: 5,
		furni: Room.getFurniById(299705672)
	},
	dice: {
		id: 300619371,
		furni: Room.getFurniById(300619371)
	}
}

const tilesId = {
	middle: 300020272,
	door: 300020282,
	regen: 300020274
}

const seats = {
	line: Room.getFurniById(299993642),
	door: Room.getFurniById(300020282),
	red: Room.getFurniById(300519482),
	blue: Room.getFurniById(300519522),
	green: Room.getFurniById(300519518),
	yellow: Room.getFurniById(300519528)
}

const messages = {
	start: 'Jogo começando!',
	special: '{}, []',
	win: 'Parabéns, {} ganhou o jogo na rodada []!',
	leave: '[] saiu!',
	strike: '{}, recebeu um strike por ausência 1/2',
	kickstrike: '{}, foi kickado do jogo por ausência! Strikes: 2/2',
	addvote: '{}, Votou para iniciar a partida! []',
	removevote: '{}, Removeu seu voto! []',
	regen: 'Ocorreu um erro ao iniciar o jogo, por favor aguarde, iniciando novamente...'
}

const specialTiles = [
	{ index: 0, action: 'start' },
	{ index: -1, action: 'finish' },

	{ index: 2, action: 'advance', use: 2 },
	{ index: 13, action: 'advance', use: 2 },
	{ index: 24, action: 'advance', use: 2 },
	{ index: 52, action: 'advance', use: 2 },

	{ index: 10, action: 'back', use: 2 },
	{ index: 19, action: 'back', use: 2 },
	{ index: 39, action: 'back', use: 2 },
	{ index: 56, action: 'back', use: 2 },

	{ index: 5, action: 'skip', use: 1 },
	{ index: 33, action: 'skip', use: 2 },

	{ index: 16, action: 'again', use: 1 },
	{ index: 44, action: 'again', use: 1 },

	{ index: 31, action: 'teleport' },
	{ index: 46, action: 'teleport' },

	{ index: 27, action: 'point' },
	{ index: 35, action: 'point' },
	{ index: 42, action: 'point' },
	{ index: 50, action: 'point' }
]

const sounds = {
	positives: ['advance', 'again', 'teleport', 'finish'],
	negatives: ['back', 'skip']
}

const specialActions = () => {
	return {
		advance: movePlayer,
		back: movePlayer,
		skip: addSpecial,
		again: addSpecial,
		teleport: teleportPlayer,
		finish: win
	}
}

const bases = {
	red: 215007,
	blue: 215005,
	green: 215008,
	yellow: 215006,
	start: 1229,
	finish: 1228,
	back: 1222,
	advance: 1226,
	skip: 1225,
	again: 1224,
	teleport: 1223,
	point: 1227
}

const display = {
	red: 'Jogador Vermelho ([])',
	blue: 'Jogador Azul ([])',
	green: 'Jogador Verde ([])',
	yellow: 'Jogador Amarelo ([])',
	house: 'Casa []',
	start: 'Largada',
	finish: 'Chegada',
	back: 'Volte [] casas.',
	advance: 'Avance [] casas',
	skip: 'Fique [] rodadas sem jogar',
	again: 'Jogue novamente',
	teleport: 'Enviado a um dos pontos laranjas mais próximos',
	point: 'Ponto laranja'
}

const botTiles = {
	regen: { x: 2, y: 37 },
	center: { x: 2, y: 36 },
	red: { x: 3, y: 36 },
	blue: { x: 4, y: 36 },
	green: { x: 4, y: 37 },
	yellow: { x: 4, y: 38 }
}

const colors = ['red', 'blue', 'green', 'yellow']

// Game Memory
const game = {
	started: false,
	round: 0,
	player: 0,
	bot: null,
	botSteps: [],
	botAvailable: true,
	narrator: null,
	cooldown: null,
	map: {},
	path: [],
	players: {},
	votes: 0,
	moveDelay: null,
	diceDelay: null
}

// Bots
const moveBot = position => {
	game.botAvailable = false

	if (game.bot) {
		const tile = botTiles[position]
		game.bot.walk(tile.x, tile.y)
	}
}

const botStepTile = (entity, furni, tile, callback) => {
	const tileId = tilesId[tile]
	const name = entity.getUsername()
	const furniId = furni.getId()

	if (furniId !== tileId || name !== 'bot') {
		return
	}

	callback()
}

const botNextStep = () => {
	const last = game.botSteps.pop()

	if (last) {
		moveBot(last)
	} else {
		game.botAvailable = true
	}
}

const addBotStep = step => {
	game.botSteps.push(step)

	if (game.botAvailable) {
		botNextStep()
	}
}

const botReturn = (entity, furni) => {
	botStepTile(entity, furni, 'middle', botNextStep)
}

const createBots = () => {
	game.narrator = createFakePlayer(config.narrator)
	game.bot = createFakePlayer(config.bot)
}

const narrator = ({ message, substitute = '', user = '' }) => {
	const bubble = config.narrator.bubble
	const msg = messages[message]
	const text = msg
	.replace('[]', substitute)
	.replace('{}', user)

	game.narrator.say(text, true, bubble)
}

const playSound = sound => {
	const furni = config.sounds[sound]
	furni.toggleState()
}

// Players
const getAllPlayersColors = () => Object.keys(game.players)

const getPlayerById = (id, key = 'furni') => {
	const players = getAllPlayersColors()

	if (!players.length) {
		return
	}

	const filter = color => (game.players[color][key]?.getId() === id)
	const player = players.find(filter)

	return game.players[player]
}

const waitingInDoor = () => {
	const playersInDoor = seats.door.getEntities()
	for (const player of playersInDoor) {
		door(player, seats.door)
	}
}

const autoStart = () => {
	const players = getAllPlayersColors()
	const users = Room.getAllPlayers()
	const allPlaying = players.length === users.length
	const votes = (game.votes >= (players.length - 1)) && game.votes >= 2

	if (players.length >= 4 || (players.length >= 2 && (allPlaying || votes))) {
		start()
	}
}

const endGame = () => {
	if (game.moveDelay) {
		Delay.cancel(game.moveDelay)
	}

	if (!game.diceDelay) {
		game.started = false
	}

	waitingInDoor()
}

const vote = (entity) => {
	if (game.started) {
		return
	}

	const id = entity.getId()
	const player = getPlayerById(id, 'user')

	if (!player) {
		return
	}

	const players = getAllPlayersColors()
	const color = player.color
	const vote = !player.voted
	const text = {}
	const need = players.length - 1
	const parse = need >= 2 ? need : 2

	game.players[color].voted = vote

	if (vote) {
		game.votes++
		text.message = 'addvote'
	} else {
		game.votes--
		text.message = 'removevote'
	}

	text.substitute = `${game.votes}/${parse}`
	text.user = player.user.getUsername()

	narrator(text)
	autoStart()
}

const returnPlayer = (color) => {
	const seat = seats[color]
	const entities = seat.getEntities()

	for (const entity of entities) {
		teleportTo(entity, seats.line)
		entity.setCanWalk(true, false)
		entity.removeEffect()
	}
}

const returnAllPlayers = () => {
	const players = getAllPlayersColors()
	for (const color of players) {
		returnPlayer(color)
	}
}

const createPlayer = (user, color) => {
	game.players[color] = { user, color }
}

const removePlayer = color => {
	const isCurrentPlayer = color === colors[game.player]

	if (isCurrentPlayer && game.moveDelay) {
		Delay.cancel(game.moveDelay)
	}

	returnPlayer(color)

	delete game.players[color]

	const users = getAllPlayersColors()

	if (users.length >= 2) {
		if (isCurrentPlayer && !game.diceDelay) {
			nextPlayer()
		}

		return
	}

	returnAllPlayers()
	reset()
	endGame()
}

const userLeave = id => {
	const player = getPlayerById(id, 'user')

	if (!player) {
		return
	}

	const message = 'leave'
	const substitute = display[player.color]
		.replace('[]', player.user.getUsername())

	narrator({ message, substitute })

	removePlayer(player.color)
}

const updateTimeBar = (color) => {
	if (color !== colors[game.player]) {
		return
	}

	const bar = config.cooldown.furni
	const state = bar.getState()
	const next = Number(state) + 1

	bar.setState(next)

	if (next >= 5) {
		killCooldown()
		strikePlayer(colors[game.player])
	}
}

const startCooldown = () => {
	const time = config.cooldown.time
	const color = colors[game.player]
	config.cooldown.furni.setState(0)
	game.cooldown = Delay.interval(() => updateTimeBar(color), Delay.seconds(time))
}

const killCooldown = () => {
	config.cooldown.furni.setState(0)

	if (game.cooldown) {
		Delay.cancel(game.cooldown)
	}

	game.cooldown = null
}

const strikePlayer = (color) => {
	const player = game.players[color]

	if (!('strike' in player)) {
		player.strike = 0
	}

	player.strike++

	const user = player.user.getUsername()

	if (player.strike >= 2) {
		const message = 'kickstrike'

		narrator({ message, user })

		return removePlayer(color)
	}

	const message = 'strike'

	narrator({ message, user })
	playSound('negative')
	nextPlayer()
}

const nextInOrder = () => {
	const players = getAllPlayersColors()
	const size = players.length
	const current = colors[game.player]

	const inc = players.indexOf(current) + 1
	const next = inc >= size ? 0 : inc
	const index = colors.indexOf(players[next])

	game.player = index

	if (next === 0) {
		game.round++
	}
}

const nextPlayer = () => {
	closeDice()

	const color = colors[game.player]
	const player = game.players[color]

	if (player) {
		player.user.removeEffect()
	}

	if (player?.again) {
		player.again -= 1
	} else {
		nextInOrder()
	}

	const color2 = colors[game.player]
	const next = game.players[color2]

	if (next?.skip) {
		next.skip -= 1
		nextInOrder()
	}

	const color3 = colors[game.player]
	const player3 = game.players[color3]

	player3.user.setEffect(config.effect)

	addBotStep(color3)
	startCooldown(color3, config.cooldown)
}

const closeDice = () => {
	config.dice.furni.setState(0)
}

const rollDice = (_, furni, isClose) => {
	if (!isClose || furni.getId() !== config.dice.id) {
		return
	}

	killCooldown()
	addBotStep('center')

	const color = colors[game.player]
	let oneTick = true

	const play = () => {
		if (!oneTick) {
			return
		}

		game.diceDelay = null

		const dice = config.dice
		const use = Number(dice.furni.getState())

		if (!game.players[color]) {
			closeDice()

			const players = getAllPlayersColors()

			if (!players.length) {
				game.started = false
				return waitingInDoor()
			}

			return nextPlayer()
		}

		const callback = applySpecial

		movePlayer({ color, use, callback })

		oneTick = false
	}

	game.diceDelay = wait(play, 6)
}

const win = ({ color }) => {
	const winner = game.players[color]
	const player = game.players[color]
	const message = 'win'
	const user = player.user.getUsername()
	const substitute = game.round

	Highscores.add(winner.user, 1)

	narrator({ message, user, substitute })
	returnAllPlayers()
	reset()
	endGame()
}

const addSpecial = ({ color, use, action, callback }) => {
	game.players[color][action] = use
	callback()
}

const teleportPlayer = ({ color, callback }) => {
	const player = game.players[color]
	const furni = player.furni

	const x = furni.getX()
	const y = furni.getY()

	const position = findInPath({ x, y })

	const random = Math.floor(Math.random() * 2)
	const index = random ? (position - 4) : (position + 4)
	const point = game.path[index]

	furni.move(point.x, point.y, 0.1)

	wait(() => callback(color), 2)
}

const movePlayer = ({ color, action, use: steps, callback }) => {
	const player = game.players[color]
	const furni = player.furni

	const x = furni.getX()
	const y = furni.getY()

	const back = action === 'back'
	const position = {
		index: findInPath({ x, y }),
		moved: 1
	}

	player.furni.setState(1)

	const moveFurni = () => {
		const { index, moved } = position
		const next = back ? (index - moved) : (index + moved)

		if (moved > steps || next >= game.path.length) {
			Delay.cancel(game.moveDelay)
			game.moveDelay = null
			player.furni.setState(0)
			return callback(color)
		}

		const tile = game.path[next]

		player.furni.move(tile.x, tile.y, 0.1)

		position.moved++
	}

	if (!game.players[color]) {
		return
	}

	game.moveDelay = Delay.interval(moveFurni, 2)

	moveFurni()
}

const specials = specialActions()
const specialsWithMovement = ['movePlayer', 'teleportPlayer']

const applySpecial = color => {
	const player = game.players[color]
	const furni = player.furni

	const x = furni.getX()
	const y = furni.getY()

	const index = findInPath({ x, y })
	const tile = game.path[index]

	const action = tile.action
	const exec = specials[action]

	if (!action || !exec) {
		return nextPlayer()
	}

	const callback = nextPlayer
	const use = tile.use
	const props = { color, action, use, callback }

	const message = 'special'
	const substitute = display[action].replace('[]', use)
	const user = player.user.getUsername()

	if (action !== 'finish')	{
		narrator({ message, substitute, user })
	}

	if (specialsWithMovement.includes(exec.name)) {
		return wait(() => exec(props), 1)
	}

	exec(props)
}

const teleportTo = (entity, furni) => {
	const x = furni.getX()
	const y = furni.getY()
	const z = furni.getZ()
	const r = furni.getR()

	entity.teleport(x, y, z, r)
}

const door = (entity, furni) => {
	if (game.started) {
		return
	}

	const furniId = furni.getId()

	if (furniId !== tilesId.door) {
		return
	}

	for (const color of colors) {
		const pillow = seats[color]

		if (!pillow.hasEntities()) {
			entity.setCanWalk(false, false)
			entity.cancelWalk()

			createPlayer(entity, color)
			autoStart()

			return teleportTo(entity, seats[color])
		}
	}
}

const returnToLine = (entity) => {
	const id = entity.getId()
	const player = getPlayerById(id, 'user')

	if (player) {
		const message = 'leave'
		const substitute = display[player.color]
			.replace('[]', player.user.getUsername())

		narrator({ message, substitute })

		return removePlayer(player.color)
	}

	const seat = seats.line
	entity.teleport(seat.getX(), seat.getY(), seat.getZ(), seat.getR())
}

// Path
const findInPath = position => game.path.findIndex(tile => tile.x === position.x && tile.y === position.y)

const getValidDirections = (tiles) => {
	const minX = Math.min(config.initX, config.maxX)
	const maxX = Math.max(config.initX, config.maxX)

	const minY = Math.min(config.initY, config.maxY)
	const maxY = Math.max(config.initY, config.maxY)

	if (tiles.x2 < minX || tiles.x2 > maxX) {
		return
	}

	if (tiles.y2 < minY || tiles.y2 > maxY) {
		return
	}

	if (game.map[tiles.x] && game.map[tiles.x][tiles.y]) {
		return
	}

	if (game.map[tiles.x2] && game.map[tiles.x2][tiles.y2]) {
		return
	}

	return true
}

const getPath = (x, y) => {
	const x2 = x
	const y2 = y

	const Xright = { x: x+1, y, x2: x+2, y2 }
	const Xleft = { x: x-1, y, x2: x-2, y2 }

	const Yup = { x, y: y+1, x2, y2: y+2 }
	const Ybottom = { x, y: y-1, x2, y2: y-2 }

	return [Xright, Xleft, Yup, Ybottom].filter(getValidDirections)
}

const setInMap = (x, y) => {
	if (!(x in game.map)) {
		game.map[x] = {}
	}

	game.map[x][y] = true
}

const addTilesInPath = (cx, cy) => {
	const directions = getPath(cx, cy)

	if (!directions.length) {
		return
	}

	const index =  Math.floor(Math.random() * directions.length)
	const tiles = directions[index]

	const { x, y, x2, y2 } = tiles

	game.path.push({ x, y })
	game.path.push({ x: x2, y: y2 })

	setInMap(x, y)
	setInMap(x2, y2)
}

const addSpecialTiles = () => {
	for (const tile of specialTiles) {
		const index = tile.index >= 0 ? tile.index : game.path.length - 1
		const action = tile.action

		game.path[index].action = action
		game.path[index].base = bases[action]

		if (tile.use) {
			game.path[index].use = tile.use
		}
	}
}

const placeTiles = () => {
	Faker.removeAllFloorItems()

	for (const i in game.path) {
		const { x, y, base } = game.path[i]
		const fakeItem = Faker.createFakeItem(base || 1231, x, y, 0, 1)

		fakeItem.setStackHeight(0.1)

		game.path[i].item = fakeItem
	}

	const players = getAllPlayersColors()

	for (const color of players) {
		const fakeItem = Faker.createFakeItem(bases[color], config.initX, config.initY, 0.1, 0)	
		game.players[color].furni = fakeItem
	}
}

const regen = (entity, furni) => {
	const regenPath = () => {
		narrator({ message: 'regen' })

		wait(() => {
			resetPath()
			start()
		}, 2)
	}

	botStepTile(entity, furni, 'regen', regenPath)
}

const generatePath = () => {
	for (let i = 0; i < 5 && game.path.length < config.size; i++) {
		resetPath()

		const repeat = Math.floor(config.size / 2)
		for (let j = 0; j < repeat; j++) {
			const last = game.path[game.path.length - 1]
			addTilesInPath(last.x, last.y)
		}
	}

	if (game.path.length < config.size) {
		return
	}

	return true
}

const displayTile = (entity, furni) => {
	const player = getPlayerById(furni.getId())

	if (player) {
		const template = display[player?.color]
		const text = template.replace('[]', player?.user?.getUsername())
		return entity.message(text)
	}

	const x = furni.getX()
	const y = furni.getY()
	const index = game.path.findIndex(tl => tl.x === x && tl.y === y)

	if (index < 0) {
		return
	}

	const tile = game.path[index]
	const house = display.house.replace('[]', index + 1)

	if (!tile.action) {
		return entity.message(house)
	}

	const info = display[tile.action].replace('[]', tile.use)

	entity.message(`${info} (${house})`)
}

const resetPath = () => {
	game.path.length = 0
	game.path[0] = { x: config.initX, y: config.initY }
	game.map = {}
}

const reset = () => {
	closeDice()
	addBotStep('center')
	resetPath()
	killCooldown()

	game.round = 0
	game.players = {}
	game.player = 0
	game.cooldown = null
	game.votes = 0
}

const start = () => {
	game.started = true
	game.player = 0

	if (!generatePath()) {
		return addBotStep('regen')
	}

	const color = colors[game.player]
	const player = game.players[color]

	const message = 'start'

	addSpecialTiles()
	placeTiles()
	addBotStep(color)
	startCooldown(color, config.cooldown)
	narrator({ message })

	player.user.setEffect(config.effect)
}

const entrance = entity => teleportTo(entity, seats.line)

// Events
Events.on('load', createBots)

Events.on('interact', displayTile)
Events.on('interact', rollDice)

Events.on('stepOn', door)
Events.on('stepOn', regen)
Events.on('stepOn', botReturn)

Events.on('userJoin', entrance)
Events.on('userLeave', userLeave)

// Commands
Commands.register(':iniciar', vote)
Commands.register(':fila', returnToLine)

// // Temporary

// Events.on('interact', (entity, furni) => Engine.debug(furni.getR()))

// const clear = () => {
// 	reset()
// 	Faker.removeAllFloorItems()
// }

// const move = (entity, message) => {
// 	const args = message.split(' ').slice(1)
// 	const color = args[0]
// 	const player = color in game.players
// 	const number = Number(args[1])

// 	if (!number || !player) {
// 		return
// 	}

// 	game.player = colors.indexOf(color)

// 	const callback = color => { Engine.debug(`${color} andou ${number} casas.`); applySpecial(color) }

// 	movePlayer({ color, action: args[2], use: number, callback })
// }

// Commands.register(':d', updateTimeBar)
// Commands.register(':c', clear)
// Commands.register(':g', entity => { reset(); start(entity) })
// Commands.register(':m', move)
// Commands.register(':r', returnAllPlayers)

// Commands.register(':bot', () => game.bot = Faker.createFakePlayer('bot', 3, 37, 0, 0))
// Commands.register(':pr', () => Room.getAllFurnisBySpriteId(3380).forEach(p => p.setState(!Number(p.getState()))))
// Commands.register(':t', () => {
// 	const tile = game.path[game.path.length - 3]
// 	game.players.red.furni.move(tile.x, tile.y, 0.1)
// })
