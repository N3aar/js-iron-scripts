// Get ID using Bot
const wait = (callback, ticks) => {
	const delay = Delay.interval(() => {
		Delay.cancel(delay)
		callback()
	}, ticks)

	return delay
}

let getid = false

const enableTool = (entity, tool) => {
	getid = !getid

	const enabled = 'Ativado com sucesso!'
	const disabled = 'Desativado com sucesso!'
	const msg = getid ? enabled : disabled

	entity.message(msg)
}

const createBotCopy = (entity, furni) => {
	if (!getid) {
		return
	}

	const name = furni.getName()
	const x = furni.getX()
	const y = furni.getY()
	const z = furni.getZ()
	const r = furni.getR()

	const bot = Faker.createFakePlayer(name, x, y, z, r)
	const id = furni.getId()
	const motto = String(id)

	bot.setMotto(motto)

	wait(() => Faker.removeEntity(bot), 20)
}

Commands.register(':id', enableTool)
Events.on('onInteract', createBotCopy)