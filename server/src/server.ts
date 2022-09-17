import express from 'express'
import cors from 'cors'

import { PrismaClient } from '@prisma/client'
import { convertHour, convertHourReverse } from './utils/convert'

const app = express()

app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
    log: ['query']
})

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    })
    return response.json(games);
})

app.post ('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    
    const body = request.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearPlaying: body.yearPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHour(body.hourStart),
            hourEnd: convertHour(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })

    return response.status(201).json(ad);
})

app.get('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;

    const ads: any = await prisma.ad.findMany({
        select: {
            id:true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearPlaying: true,
            hourStart: true,
            hourEnd: true
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAd: 'desc'
        }
    })

    return response.json(ads.map((ad: { weekDays: string; hourStart: number; hourEnd: number }) => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertHourReverse(ad.hourStart),
            hourEnd: convertHourReverse(ad.hourEnd)
        }
    }))
})

app.get('/ads/:id/discord', async (request, response) => {
    const adId = request.params.id;

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where : {
            id: adId
        }
    })

    return response.json({
        discord: ad.discord
    })
})

app.listen(3333)