// mailparser.d.ts
declare module 'mailparser' {
    import { AddressObject, ParsedMail } from 'mailparser';
    export function simpleParser(source: any, options?: any): Promise<ParsedMail>;
}