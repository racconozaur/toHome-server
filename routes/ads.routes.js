const Router = require('express')
const { validationResult } = require('express-validator')
const router = new Router()
const multer = require('multer')
const cloudinary = require('../helpers/uploadImageHelper')
const Ads = require('../models/Ads')

// muler storage
const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	},
})

const upload = multer({
	storage: storage,
}).single('testImage')

// ads routes

router.post('/postads', async (req, res) => {
	try {
		upload(req, res, async (err) => {
			if (err) {
				console.log(err)
				res.send({ message: 'Server error' })
			} else {
				const errors = validationResult(req)
				if (!errors.isEmpty()) {
					return res
						.status(400)
						.json({ message: 'Uncorrect request', errors })
				}

				const prevAds = await Ads.deleteMany({})

				const { link, description } = req.body

				const result = await cloudinary.uploader.upload(req.file.path, {
					public_id: `${req.file.filename}__ADS`,
					crop: 'fill',
				})

				const ads = new Ads({
					image: result.url,
					link,
					description,
				})
				ads.save()
					.then(() => res.json({ message: 'Message sent', ads: ads }))
					.catch((err) => console.log(err))
			}
		})
	} catch (error) {
		console.log(error)
		res.send({ message: 'Server error' })
	}
})

router.get('/allAds', async (req, res) => {
	try {
		const ads = await Ads.find({})
		return res.json(ads)
	} catch (error) {
		console.log(error)
		res.send({ message: 'Server error' })
	}
})

router.delete(`/deleteAds`, async (req, res) => {
	try {
		await Ads.deleteMany({})
		return res.status(204).json({})
	} catch (e) {
		console.log(e)
		res.send({ message: 'Server error' })
	}
})

module.exports = router
