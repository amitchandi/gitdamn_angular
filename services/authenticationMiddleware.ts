import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function userAutheticate(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.jwt

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token not available' })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err: any, decodedToken: any) => {
        if (err) {
            return res.status(401).json({ message: 'Not authorized' })
        } else {
            // console.log(decodedToken)
            next()
        }
    })
}

export function adminAutheticate(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.jwt

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token not available' })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err: any, decodedToken: any) => {
        if (err) {
            return res.status(401).json({ message: 'Not authorized' })
        } else {
            if (decodedToken.role !== 'admin') {
                return res.status(401).json({ message: "Not authorized" })
            } else {
                next()
            }
        }
    })
}