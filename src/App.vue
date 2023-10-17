<template>
  <div id="tables">
    <table id="variable-table" class="param-table"> <!-- Table of variables -->
      <tr>
        <th>Variable name</th>
      </tr>
      <tr v-for="(variable, ind) in values" :key="ind">
        <td>
          <input v-model="variable.name" :ref="setVariableRef" />
        </td>
      </tr>
      <tr>
        <td>
          <input v-model="new_stuff.variable" placeholder="Enter new name here" @input="addNewVariable"/>
        </td>
      </tr>
    </table>
    <table id="const-table" class="param-table"> <!-- Table of consts -->
      <tr>
        <th>Constant's name</th>
        <th>Constant's value</th>
      </tr>
      <tr v-for="(constant, ind) in constants" :key="ind">
        <td>
          <input v-model="constant.name" :ref="setConstantRef" />
        </td>
        <td>
          <input v-model="constant.value" type="number" @input="recalculate" />
        </td>
      </tr>
      <tr>
        <td>
          <input v-model="new_stuff.constant" placeholder="Enter new name here" @input="addNewConstant"/>
        </td>
      </tr>
    </table>
    <table id="formula-table" class="param-table"> <!-- Table of formulas -->
      <tr>
        <th>Variable name</th>
        <th>Formula</th>
      </tr>
      <tr v-for="(variable, ind) in formula_variables" :key="ind">
        <td>
          <input v-model="variable.name" :ref="setFormulaRef" />
          <span v-if="!variable.working">(Wrong)</span>
        </td>
        <td><input v-model="variable.formulaStr" @blur="recalculate" /></td>
      </tr>
      <tr>
        <td>
          <input v-model="new_stuff.formula" placeholder="Enter new name here" @input="addNewFormula"/>
        </td>
      </tr>
    </table>
  </div>
  <table id="main-table"> <!-- Table of values -->
    <tr>
      <th>Test Number</th>
      <template v-for="variable in values" :key="variable.name">
        <th class="var-column">
          {{ variable.name }}
        </th>
        <th class="err-column">
          Δ{{ variable.name }}
        </th>
      </template>
      <template v-for="variable in formula_variables" :key="variable.name">
        <template v-if="variable.working">
          <th class="form-var-column">
            {{ variable.name }}
          </th>
          <th class="form-err-column">
            Δ{{ variable.name }}
          </th>
        </template>
      </template>
    </tr>
    <tr v-for="(number, index) in tests" :key="index">
      <td>{{ number }}</td>
      <template v-for="variable in values" :key="variable.name">
        <th class="var-column">
          <input type="number" v-model="variable.values[index]" @input="recalculate" />
        </th>
        <th class="err-column">
          <input type="number" v-model="variable.errors[index]" @input="recalculate" />
        </th>
      </template>
      <template v-for="variable in formula_variables" :key="variable.name">
        <template v-if="variable.working">
          <th class="form-var-column">
            <input type="number" v-model="variable.values[index]" @input="recalculate" />
          </th>
          <th class="form-err-column">
            <input type="number" v-model="variable.errors[index]" @input="recalculate" />
          </th>
        </template>
      </template>

    </tr>
  </table>
  <button v-on:click="addNewTest" style="margin-top:20px;">Add new test</button>
</template>

<script>
import { CalcType } from './calc'
import { defineComponent } from 'vue'

import parser from './parser'

// const gravity = new Mul(new NamedConst('G'), new Div(new Mul(new Variable('m1'),
//   new Variable('m2')), new Exp(new Variable('r'), new Const(2))))

export default defineComponent({
  data () {
    return {
      tests: 3,
      values: [
        // {
        //   name: 'm1',
        //   values: [],
        //   errors: []
        // },
        // {
        //   name: 'm2',
        //   values: [],
        //   errors: []
        // },
        // {
        //   name: 'r',
        //   values: [],
        //   errors: []
        // }
      ],
      constants: [
        {
          name: 'G',
          value: 6.67 * 1e-11
        }
      ],
      formula_variables: [

      ],
      new_stuff: {
        variable: '',
        constant: '',
        formula: ''
      },
      refs: {
        variables: [],
        constants: [],
        formulas: [],
        refocus: {
          need: false,
          to: 0
        }
      }
    }
  },
  methods: {
    setVariableRef (el) {
      this.refs.variables.push(el)
    },
    setConstantRef (el) {
      this.refs.constants.push(el)
    },
    setFormulaRef (el) {
      this.refs.formulas.push(el)
    },
    addNewVariable () {
      this.values.push({
        name: this.new_stuff.variable,
        values: [],
        errors: []
      })
      this.new_stuff.variable = ''
      this.refs.refocus.need = true
      this.refs.refocus.to = 0
      this.resize()
    },
    addNewTest () {
      this.tests++
      this.resize()
    },
    addNewConstant () {
      this.constants.push({
        name: this.new_stuff.constant,
        value: 0
      })
      this.new_stuff.constant = ''
      this.refs.refocus.need = true
      this.refs.refocus.to = 1
      this.recalculate()
    },
    parseFormulas () {
      const vars = []
      const namedConsts = []
      for (const a of this.values) {
        vars.push(a.name)
      }
      for (const a of this.constants) {
        namedConsts.push(a.name)
      }
      for (const a of this.formula_variables) {
        vars.push(a.name)
      }
      for (const variable of this.formula_variables) {
        if (variable.formulaStr === '') {
          variable.working = false
          continue
        }
        const result = parser(variable.formulaStr, vars, namedConsts)
        if (result.success) {
          variable.formula = result.value
          variable.working = true
        } else {
          variable.working = false
        }
      }
    },
    addNewFormula () {
      this.formula_variables.push({
        name: this.new_stuff.formula,
        formula: new CalcType(),
        values: [],
        errors: [],
        formulaStr: '',
        working: false
      })
      this.new_stuff.formula = ''
      this.refs.refocus.need = true
      this.refs.refocus.to = 2
      this.resize()
    },
    resize () {
      for (const variable of this.values) {
        while (variable.values.length > this.tests) {
          variable.values.pop()
          variable.errors.pop()
        }
        while (variable.values.length < this.tests) {
          variable.values.push(1)
          variable.errors.push(0)
        }
      }
      for (const formVar of this.formula_variables) {
        while (formVar.values.length > this.tests) {
          formVar.values.pop()
          formVar.errors.pop()
        }
        while (formVar.values.length < this.tests) {
          formVar.values.push(0)
          formVar.errors.push(0)
        }
      }
      this.recalculate()
    },
    recalculate () {
      this.parseFormulas()
      const namedConstMap = {}
      for (const constant of this.constants) {
        namedConstMap[constant.name] = constant.value
      }
      for (const [index, val] of this.formula_variables.entries()) {
        if (val.formula === undefined) {
          continue
        }
        for (let ind = 0; ind < this.tests; ind++) {
          const map = {}
          for (const vr of this.values) {
            map[vr.name] = {
              value: vr.values[ind],
              relativeError: vr.errors[ind] / vr.values[ind]
            }
          }
          for (let i = 0; i < index; ++i) {
            const vr = this.formula_variables[i]
            map[vr.name] = {
              value: vr.values[ind],
              relativeError: vr.errors[ind] / vr.values[ind]
            }
          }
          const computed = val.formula.Compute(map, namedConstMap)
          val.values[ind] = computed.value
          val.errors[ind] = computed.absoluteError()
        }
      }
    }
  },
  beforeMount () {
    document.title = 'KMax'
    this.tests = 1
    this.resize()
    // this.formula_variables.push({
    //   name: 'F',
    //   values: [],
    //   errors: [],
    //   formula: new CalcType(),
    //   formulaStr: 'G*(m1*m2)/r^2',
    //   working: true
    // })
  },
  mounted () {
    // try {
    //   console.log(parser('G*(m1*m2)/r^2', vars, namedConsts))
    // } catch (e) {
    //   console.log('parser fail: ' + e)
    // }
  },
  beforeUpdate () {
    this.refs.variables = []
    this.refs.constants = []
    this.refs.formulas = []
  },
  updated () {
    if (!this.refs.refocus.need) {
      return
    }
    this.refs.refocus.need = false
    if (this.refs.refocus.to === 0 && this.refs.variables.length > 0) {
      this.refs.variables[this.refs.variables.length - 1].focus()
    } else if (this.refs.refocus.to === 1 && this.refs.constants.length > 0) {
      this.refs.constants[this.refs.constants.length - 1].focus()
    } else if (this.refs.refocus.to === 2 && this.refs.formulas.length > 0) {
      this.refs.formulas[this.refs.formulas.length - 1].focus()
    }
  }
})
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 10px;
}

div#tables {
  margin-bottom: 30px;
  width: 1200px;
  display: flex;
  flex-wrap: wrap;
}

#main-table {
  width: 90%;
  tr {
    height: 20px;
    text-align: right;
    input {
      width: 80%;
    }
  }
}

.param-table {
  margin-right: 30px;
  tr {
    width: 70px;
  }
  td, th {
    padding: 10px;
  }
}

table, tr, td, th {
  border: 1px solid grey;
  border-collapse: collapse;
}

.var-column, .form-var-column {
  border-left: 3px solid grey;
}

input {
  border: none;
}

</style>
