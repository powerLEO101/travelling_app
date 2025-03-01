// app.mjs
import express from 'express';
import path from 'path';
import url from 'url';
import fs from 'fs';


export let server = null;
export const app = express();