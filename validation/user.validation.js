const joi = require('joi')

const updateProfileSchema = joi.object({
    username : joi.string().min(3).max(30),
    phone : joi.string().pattern(/^[0-9+]+$/),
    avatar : joi.string().uri(),
    addresses : joi.string().min(10).max(100)
}).min(1).messages({
    'object.min' : 'Request body can not be empty'
})

module.exports = {
    updateProfileSchema
}