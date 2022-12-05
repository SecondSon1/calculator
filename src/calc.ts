export interface VariableMapValue {
  value: number
  relativeError: number
}

export interface VariableMap {
  [key: string]: VariableMapValue
}

export interface NamedConstMap {
  [key: string]: number
}

export class CalcValue {
  value: number
  relativeError: number

  constructor (value: number, relativeError: number) {
    this.value = value
    this.relativeError = relativeError
  }

  absoluteError () {
    return this.value * this.relativeError
  }
}

export class CalcType {
  priority = 0

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    return new CalcValue(0, 0)
  }

  toString (): string {
    return ''
  }
}

export class Const extends CalcType {
  priority = 10
  value: number

  constructor (value: number) {
    super()
    this.value = value
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    return new CalcValue(this.value, 0)
  }

  override toString (): string {
    return this.value.toString()
  }
}

export class NamedConst extends CalcType {
  priority = 10
  name: string

  constructor (name: string) {
    super()
    this.name = name
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    return new CalcValue(namedConstants[this.name], 0)
  }

  override toString (): string {
    return this.name
  }
}

export class Variable extends CalcType {
  priority = 10
  name: string

  constructor (name: string) {
    super()
    this.name = name
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    return new CalcValue(vars[this.name].value, vars[this.name].relativeError)
  }

  override toString (): string {
    return this.name
  }
}

export class Add extends CalcType {
  priority = 5
  a: CalcType
  b: CalcType

  constructor (a: CalcType, b: CalcType) {
    super()
    this.a = a
    this.b = b
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const aVal = this.a.Compute(vars, namedConstants)
    const bVal = this.b.Compute(vars, namedConstants)
    const sumVal = aVal.value + bVal.value
    return new CalcValue(sumVal, (aVal.absoluteError() + bVal.absoluteError()) / sumVal)
  }

  override toString (): string {
    let res = ''
    if (this.a.priority >= this.priority) {
      res += this.a.toString()
    } else {
      res += '(' + this.a.toString() + ')'
    }
    res += ' + '
    if (this.b.priority >= this.priority) {
      res += this.b.toString()
    } else {
      res += '(' + this.b.toString() + ')'
    }
    return res
  }
}

export class Sub extends CalcType {
  priority = 5
  a: CalcType
  b: CalcType

  constructor (a: CalcType, b: CalcType) {
    super()
    this.a = a
    this.b = b
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    // const aVal = this.a.Compute(vars)
    // const bVal = this.b.Compute(vars)
    // const subVal = aVal.value - bVal.value
    // return new CalcValue(subVal, (aVal.absoluteError() + bVal.absoluteError()) / subVal)
    return new Add(this.a, new Mul(this.b, new Const(-1))).Compute(vars, namedConstants)
  }

  override toString (): string {
    let res = ''
    if (this.a.priority >= this.priority) {
      res += this.a.toString()
    } else {
      res += '(' + this.a.toString() + ')'
    }
    res += ' - '
    if (this.b.priority > this.priority) {
      res += this.b.toString()
    } else {
      res += '(' + this.b.toString() + ')'
    }
    return res
  }
}

export class Mul extends CalcType {
  priority = 7
  a: CalcType
  b: CalcType

  constructor (a: CalcType, b: CalcType) {
    super()
    this.a = a
    this.b = b
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const aVal = this.a.Compute(vars, namedConstants)
    const bVal = this.b.Compute(vars, namedConstants)
    const mulVal = aVal.value * bVal.value
    return new CalcValue(mulVal, aVal.relativeError + bVal.relativeError)
  }

  override toString (): string {
    let res = ''
    if (this.a.priority >= this.priority) {
      res += this.a.toString()
    } else {
      res += '(' + this.a.toString() + ')'
    }
    res += ' * '
    if (this.b.priority >= this.priority) {
      res += this.b.toString()
    } else {
      res += '(' + this.b.toString() + ')'
    }
    return res
  }
}

export class Div extends CalcType {
  priority = 7
  num: CalcType
  den: CalcType

  constructor (num: CalcType, den: CalcType) {
    super()
    this.num = num
    this.den = den
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const numVal = this.num.Compute(vars, namedConstants)
    const denVal = this.den.Compute(vars, namedConstants)
    const divVal = numVal.value / denVal.value
    return new CalcValue(divVal, numVal.relativeError + denVal.relativeError)
  }

  override toString (): string {
    let res = ''
    if (this.num.priority >= this.priority) {
      res += this.num.toString()
    } else {
      res += '(' + this.num.toString() + ')'
    }
    res += ' / '
    if (this.den.priority > this.priority) {
      res += this.den.toString()
    } else {
      res += '(' + this.den.toString() + ')'
    }
    return res
  }
}

export class Exp extends CalcType {
  priority = 8
  base: CalcType
  power: CalcType

  constructor (base: CalcType, power: CalcType) {
    super()
    this.base = base
    this.power = power
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const baseVal = this.base.Compute(vars, namedConstants)
    const powerVal = this.power.Compute(vars, namedConstants)
    const powVal = Math.pow(baseVal.value, powerVal.value)
    return new CalcValue(powVal, baseVal.relativeError * powerVal.value)
  }

  override toString (): string {
    let res = ''
    if (this.base.priority > this.priority) {
      res += this.base.toString()
    } else {
      res += '(' + this.base.toString() + ')'
    }
    res += ' ^ '
    if (this.power.priority > this.priority) {
      res += this.power.toString()
    } else {
      res += '(' + this.power.toString() + ')'
    }
    return res
  }
}

export class Sqrt extends CalcType {
  priority = 10
  base: CalcType

  constructor (base: CalcType) {
    super()
    this.base = base
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    return new Exp(this.base, new Const(0.5)).Compute(vars, namedConstants)
  }

  override toString (): string {
    return 'sqrt(' + this.base.toString() + ')'
  }
}

export class Ln extends CalcType {
  priority = 8
  antiLogarithm: CalcType

  constructor (antiLogarithm: CalcType) {
    super()
    this.antiLogarithm = antiLogarithm
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const argVal = this.antiLogarithm.Compute(vars, namedConstants)
    return new CalcValue(Math.log(argVal.value), 0) // TODO
  }

  override toString (): string {
    return 'ln(' + this.antiLogarithm.toString() + ')'
  }
}

export class Log2 extends CalcType {
  priority = 8
  antiLogarithm: CalcType

  constructor (antiLogarithm: CalcType) {
    super()
    this.antiLogarithm = antiLogarithm
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const argVal = this.antiLogarithm.Compute(vars, namedConstants)
    return new CalcValue(Math.log2(argVal.value), 0) // TODO
  }

  override toString (): string {
    return 'log2(' + this.antiLogarithm.toString() + ')'
  }
}

export class Log10 extends CalcType {
  priority = 8
  antiLogarithm: CalcType

  constructor (antiLogarithm: CalcType) {
    super()
    this.antiLogarithm = antiLogarithm
  }

  override Compute (vars: VariableMap, namedConstants: NamedConstMap): CalcValue {
    const argVal = this.antiLogarithm.Compute(vars, namedConstants)
    return new CalcValue(Math.log10(argVal.value), 0) // TODO
  }

  override toString (): string {
    return 'log10(' + this.antiLogarithm.toString() + ')'
  }
}
