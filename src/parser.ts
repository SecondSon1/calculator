enum TokenType {
  Variable, // Variable or NamedConst
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

function SplitIntoTokens (s: string, vars: string[]) {
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

export default function (s: string, vars: string[]) {
  const tokens = SplitIntoTokens(s, vars)
  console.log(tokens)
  // Check regular syntactic errors
}
