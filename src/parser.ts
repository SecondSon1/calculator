import {
  Add,
  Sub,
  Mul,
  Div,
  Exp,
  Ln,
  Log2,
  Log10,
  Sqrt,
  CalcValue,
  Variable,
  NamedConst,
  CalcType,
  Const
} from '@/calc'

enum TokenType {
  Variable,
  NamedConst,
  Number, // Const
  Operation, // Add, Sub, Mul, Sub, Exp
  Function, // ln, log2, log10, sqrt
  Paren
}

class Token {
  type: TokenType
  token: string

  constructor (type: TokenType, token: string) {
    this.type = type
    this.token = token
  }
}

function IsAlpha (s: string) {
  return s.toUpperCase() !== s.toLowerCase()
}

function IsDigit (s: string) {
  return '0'.charCodeAt(0) <= s.charCodeAt(0) && s.charCodeAt(0) <= '9'.charCodeAt(0)
}

function IsFunction (s: string) {
  return s === 'ln' || s === 'log2' || s === 'log10' || s === 'sqrt'
}

function IsOperation (s: string) {
  return s === '+' || s === '-' || s === '*' || s === '/' || s === '^'
}

const functions: string[] = [
  'ln', 'log2', 'log10', 'sqrt'
]

function SplitIntoTokens (s: string, vars: string[], namedConsts: string[]) {
  const ans: Token[] = []
  for (let i = 0; i < s.length; ++i) {
    if (s[i] === ' ') {
      continue
    }
    if (s[i] === '(' || s[i] === ')') {
      ans.push(new Token(TokenType.Paren, s[i]))
    } else if (IsAlpha(s[i])) {
      let flag = false
      for (const func of functions) {
        if (i + func.length <= s.length && func === s.substring(i, i + func.length)) {
          flag = true
          ans.push(new Token(TokenType.Function, func))
          i += func.length - 1
          break
        }
      }
      if (flag) {
        continue
      }
      for (const variable of vars) {
        if (i + variable.length <= s.length && variable === s.substring(i, i + variable.length)) {
          flag = true
          ans.push(new Token(TokenType.Variable, variable))
          i += variable.length - 1
          break
        }
      }
      if (flag) {
        continue
      }
      for (const namedConst of namedConsts) {
        if (i + namedConst.length <= s.length && namedConst === s.substring(i, i + namedConst.length)) {
          flag = true
          ans.push(new Token(TokenType.NamedConst, namedConst))
          i += namedConst.length - 1
          break
        }
      }
      if (!flag) {
        throw new Error('Unknown function/variable: "' + s.substring(i, Math.max(s.length, i + 5)) + '..."')
      }
    } else if (IsDigit(s[i])) {
      let cur = s[i]
      while (i + 1 < s.length && IsDigit(s[i + 1])) {
        i++
        cur += s[i]
      }
      ans.push(new Token(TokenType.Number, cur))
    } else if (IsOperation(s[i])) {
      ans.push(new Token(TokenType.Operation, s[i]))
    } else {
      throw new Error('Unknown symbol: "' + s[i] + '"')
    }
  }
  return ans
}

let token: Token
let tokens: Token[]
let tokenIndex: number

function GetNext () {
  if (tokenIndex !== tokens.length - 1) {
    token = tokens[++tokenIndex]
  }
}

function Expect (tt: TokenType, val: string) {
  if (token.type !== tt || (val !== '' && val !== token.token)) {
    console.log('expected ', TokenType[tt], ', but got ', TokenType[token.type])
  }
}

function Function (): CalcType {
  Expect(TokenType.Function, '')
  const func = token.token
  GetNext()
  let result = AdditionPriority()
  switch (func) {
    case 'ln':
      result = new Ln(result)
      break
    case 'log2':
      result = new Log2(result)
      break
    case 'log10':
      result = new Log10(result)
      break
    case 'sqrt':
      result = new Sqrt(result)
      break
  }
  return result
}

function Parens (): CalcType {
  Expect(TokenType.Paren, '(')
  GetNext()
  const ans = AdditionPriority()
  Expect(TokenType.Paren, ')')
  GetNext()
  return ans
}

function AdditionPriority (): CalcType {
  let begin = '+'
  if (token.type === TokenType.Operation && (token.token === '+' || token.token === '-')) {
    begin = token.token
    GetNext()
  }
  let ans = MultiplicationPriority()
  if (begin === '-') {
    ans = new Mul(ans, new Const(-1))
  }
  while (token.type === TokenType.Operation && (token.token === '+' || token.token === '-')) {
    const add = token.token === '+'
    GetNext()
    const nxt = MultiplicationPriority()
    if (add) {
      ans = new Add(ans, nxt)
    } else {
      ans = new Sub(ans, nxt)
    }
  }
  return ans
}

function MultiplicationPriority (): CalcType {
  let ans = ExponentiationPriority()
  while (token.type === TokenType.Operation && (token.token === '*' || token.token === '/')) {
    const mul = token.token === '*'
    GetNext()
    const nxt = ExponentiationPriority()
    if (mul) {
      ans = new Mul(ans, nxt)
    } else {
      ans = new Div(ans, nxt)
    }
  }
  return ans
}

function ExponentiationPriority (): CalcType {
  const ans: CalcType[] = [FinalPriority()]
  while (token.type === TokenType.Operation && token.token === '^') {
    GetNext()
    ans.push(FinalPriority())
  }
  while (ans.length > 1) {
    const exp = ans[ans.length - 1]
    ans.pop()
    const base = ans[ans.length - 1]
    ans.pop()
    ans.push(new Exp(base, exp))
  }
  return ans[0]
}

function FinalPriority (): CalcType {
  if (token.type === TokenType.Variable || token.type === TokenType.NamedConst) {
    const variable = token.type === TokenType.Variable
    const name = token.token
    GetNext()
    if (variable) {
      return new Variable(name)
    } else {
      return new NamedConst(name)
    }
  } else if (token.type === TokenType.Number) {
    const val = +token.token
    return new Const(val)
  } else if (token.type === TokenType.Function) {
    return Function()
  } else {
    Expect(TokenType.Paren, '(')
    return Parens()
  }
}

export default function (s: string, vars: string[], namedConsts: string[]): CalcType {
  tokens = SplitIntoTokens(s, vars, namedConsts)
  tokenIndex = 0
  token = tokens[0]
  return AdditionPriority()
}
